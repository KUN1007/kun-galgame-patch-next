// Package client wraps the HTTP calls to the NextMoe catalog service (galgame surface).
//
// Background (D8 / D11): this project (the patch service) no longer stores
// galgame / tag / official metadata locally; instead it fetches it from the
// galgame service by vndb_id. galgame's search is backed by Meilisearch with CJK
// tokenization, typo tolerance and facet aggregation, far better than in-repo
// ILIKE or a local index.
//
// See docs/galgame_wiki/api-reference.md.
package client

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// galgameCodeNotFound is the envelope business code the galgame/catalog faces
// use for "no such row". The client mints it itself in the one place a read
// resolves to nothing locally (an unregistered gid, or a work whose claim is
// not live), so every caller's existing "is this a 404?" branch keeps working
// without learning about the two-hop resolution behind it.
const galgameCodeNotFound = 404

// GalgameError is returned by write methods on the Client when the galgame service
// envelope reports a non-zero `code`. It carries the wire-level (code,
// message) so the outer handler can transparently forward them — per
// docs/galgame_wiki/integration-guide.md §2 "直接透传 galgame service 的 code +
// message 给前端".
type GalgameError struct {
	Code    int
	Message string
	// HTTPStatus is the status the catalog answered with, or 0 when the client
	// minted the verdict itself without ever dialling.
	//
	// The envelope `code` alone cannot say WHOSE fault a failure was: the
	// catalog spells "your parameter is malformed" and "my database fell over"
	// in the same 1-999 general block. The status is the half of the answer
	// that separates them, so it is recorded beside the code everywhere a
	// response actually arrived (see upstreamError).
	HTTPStatus int
	// Moved is the survivor id of a MERGED entity: the catalog answered 301 +
	// catalogCodeMoved because this id's identity now lives on that one. Zero
	// on every other verdict. It rides the error rather than a success value
	// because the request did NOT produce the record that was asked for — the
	// survivor's content must never be served under the dead id.
	Moved int64
}

func (e *GalgameError) Error() string {
	return fmt.Sprintf("galgame business error code=%d: %s", e.Code, e.Message)
}

// Absent reports whether this verdict is the documented "no such row" rather
// than a failure that merely happens to arrive carrying a 404.
//
// Same discipline as catalogAbsent (which judges the pair for the reads that
// still hold the status in hand): the proof is the PAIRING of the catalog's own
// not-found business code with the 404, never the status alone. A ROUTE-level
// 404 — a renamed path, a proxy's HTML — echoes 404 into `code` instead, and
// folding that in is how a whole read face fails silently.
//
// The second shape is the client's own miss: it minted the verdict for an id it
// could not even parse or for a work whose claim is not live, so there is no
// status to pair with.
func (e *GalgameError) Absent() bool {
	if e.HTTPStatus == 0 {
		return e.Code == galgameCodeNotFound
	}
	return e.HTTPStatus == http.StatusNotFound && e.Code == catalogCodeNotFound
}

// IsAbsent is Absent over an opaque error — the form handlers use to answer a
// miss with their own 404 instead of forwarding the upstream code verbatim.
func IsAbsent(err error) bool {
	var gerr *GalgameError
	return errors.As(err, &gerr) && gerr.Absent()
}

// MovedTarget reports the survivor id when err is the catalog's documented
// "this id was merged away" verdict — the pairing of catalogCodeMoved with the
// 301, never the status alone, for catalogAbsent's reason.
//
// Handlers must check it BEFORE IsAbsent: both arrive as errors, but a merge is
// the opposite of a miss. Answering it with a 404 would retire a live company's
// old URL instead of forwarding it, losing every inbound link that ever pointed
// at the id that lost the merge.
func MovedTarget(err error) (int64, bool) {
	var gerr *GalgameError
	if !errors.As(err, &gerr) {
		return 0, false
	}
	if gerr.HTTPStatus != http.StatusMovedPermanently || gerr.Code != catalogCodeMoved || gerr.Moved <= 0 {
		return 0, false
	}
	return gerr.Moved, true
}

// AsBadRequest reports whether err is the catalog REJECTING THE REQUEST — a
// parameter sent in a shape the face does not accept — as opposed to failing to
// serve a well-formed one.
//
// Handlers must keep the two apart. A 400 is a caller error (ours, or the
// browser's when a query parameter rides through untouched); answering it with
// "调用 Galgame 资料库失败" — a 500 — tells the user the registry is down, tells
// the operator to go look at a healthy service, and hides the one fact that
// would fix it: which parameter was wrong. A 5xx or a transport failure IS the
// registry being down, and keeps that spelling.
func AsBadRequest(err error) (*GalgameError, bool) {
	var gerr *GalgameError
	if !errors.As(err, &gerr) || gerr.HTTPStatus != http.StatusBadRequest {
		return nil, false
	}
	return gerr, true
}

// upstreamError builds the envelope error for a response that carried one, so
// every decode site records the status beside the business code instead of half
// of them dropping it.
func upstreamError(resp *http.Response, code int, message string) *GalgameError {
	return &GalgameError{Code: code, Message: message, HTTPStatus: resp.StatusCode}
}

// Client is a thin wrapper around calls to the NextMoe catalog service (galgame
// surface). It derives three faces from one host base:
//
//   - v1Base       = {base}/v1       — the public data contract. Since wave
//     A2-2 the whole galgame READ set consumes the CATALOG face under it
//     (/v1/catalog/*): works list + detail, the release calendar, the works
//     product search, the taxonomy browse reads and the reverse lookup. The
//     deprecated /v1/galgame product face is no longer called at all — that
//     surface carries Deprecation + Sunset 2026-10-31 headers and is being
//     taken down. A BFF-side adaptation layer (catalog_dto.go / catalog_map.go
//     / catalog_resolve.go) projects the registry's records back onto this
//     client's DTOs so moyu's own API output stays stable. Gated by the
//     internal-tier X-API-Key (galgame:read + galgame:nsfw scopes).
//
//     TWO-HOP READS: the catalog addresses works by its own id while moyu is
//     gid-native, so a gid-keyed read resolves through the reverse lookup first
//     and hydrates second (see catalog_resolve.go). The claim pointer's `state`
//     that comes back is what replaced the wiki `status` filter — reads gate on
//     state == live, which is also the ban gate.
//
//   - internalBase = {base}/internal — the internal-tier platform-workflow face,
//     gated by an X-API-Key. What STAYS here: the JWT personal reads (/galgame/
//     mine, /galgame/messages/mine), the publish picker's status=0,2 +
//     include_pending search, the user-stats read, the S2S cron message feed,
//     the taxonomy revision-history reads, AND (since wave 06a) the user
//     write set — galgame submit / draft update+delete / claim / image upload /
//     links+aliases relation edits. Personalized reads and user writes carry
//     dual credentials (X-API-Key = client identity; Authorization: Bearer =
//     user identity, which the catalog's jwtAuth validates itself).
//
//   - legacyBase   = {base}/api      — the legacy face; only the staff taxonomy
//     family (tag/official/engine/series CRUD + revert) and /admin/* stay here.
//
// The internal + v1 faces hard-depend on the internal-tier API key: there is no
// empty-key fallback to /api. The rollback valve was retired in open-API phase 2
// wave 05 — a configured base with an empty key fails fast at startup (see
// app.New). Read/write face selection is by ROUTE membership, not HTTP method
// (see readTarget / writeTarget); the /v1 reads route through dedicated methods.
type Client struct {
	v1Base       string
	internalBase string
	legacyBase   string
	apiKey       string
	http         *http.Client
	// gids caches the wiki gid -> catalog work id mapping the catalog reads
	// resolve through (see catalog_resolve.go). Identity only: the volatile
	// claim state is always read fresh from the hydration call.
	gids *gidMap
}

// NewWithKey constructs a Client that routes read-set calls (and the S2S cron
// message feed) AND the user write set to the internal face ({base}/internal +
// X-API-Key) using apiKey; only the staff taxonomy family + /admin/* stay on the
// legacy /api face. baseURL is the NextMoe host base (no /api or /internal
// suffix), e.g. http://127.0.0.1:19281. apiKey is the internal-tier key and is
// required for every read/write — there is no legacy fallback, so callers
// validate it is non-empty at startup (app.New fails fast otherwise).
func NewWithKey(baseURL, apiKey string) *Client {
	base := strings.TrimRight(baseURL, "/")
	return &Client{
		v1Base:       base + "/v1",
		internalBase: base + "/internal",
		legacyBase:   base + "/api",
		apiKey:       apiKey,
		// Never follow a redirect. The catalog answers a merged entity id with
		// 301 + current_id so the caller can forward the BROWSER in one hop;
		// auto-following would swallow that and return the survivor's record
		// under the dead id — one company on two URLs, the outcome the redirect
		// exists to prevent. No other catalog endpoint answers 3xx.
		http: &http.Client{
			Timeout: 10 * time.Second,
			CheckRedirect: func(*http.Request, []*http.Request) error {
				return http.ErrUseLastResponse
			},
		},
		gids:         newGIDMap(),
	}
}

// readTarget picks the base URL + X-API-Key for a read by ROUTE membership,
// not HTTP method:
//   - every read-set path goes to the internal face with the internal-tier
//     X-API-Key attached;
//   - /admin/* reads never belong to the internal read face — they stay on the
//     legacy /api face (moyu has no galgame-admin reads today, but the guard keeps
//     parity with the shared design).
//
// There is no empty-key fallback to /api: the read face hard-depends on the key
// (the rollback valve was retired in open-API phase 2 wave 05; app.New fails
// fast when the base is configured but the key is empty).
func (c *Client) readTarget(path string) (base, apiKey string) {
	if strings.HasPrefix(path, "/admin/") {
		return c.legacyBase, ""
	}
	return c.internalBase, c.apiKey
}

// writeTarget picks the base URL + X-API-Key for a WRITE by ROUTE membership,
// mirroring readTarget:
//   - user-write-set paths go to the internal face with the internal-tier
//     X-API-Key attached (the user JWT rides Authorization separately — dual
//     credential);
//   - everything else (the staff taxonomy family CRUD+revert and /admin/*)
//     stays on the legacy /api face with no key.
//
// The user write set was platformized onto the internal face in open-API phase 2
// wave 06a (catalog W1 mounted these paths behind the devapi galgame:write
// chain). There is no empty-key fallback: the internal write face hard-depends
// on the key (app.New fails fast when the base is configured but the key is
// empty — same fail-fast as the read face).
func (c *Client) writeTarget(path string) (base, apiKey string) {
	if isUserWritePath(path) {
		return c.internalBase, c.apiKey
	}
	return c.legacyBase, ""
}

// isUserWritePath reports whether a galgame path (no face prefix; a trailing
// query string is allowed) is a member of the user write set that moved to the
// internal face in open-API phase 2 wave 06a: galgame submit, draft
// update/patch/delete, claim, and cover/screenshot image upload. The
// links/aliases relation edits used to be members too; they were retired in
// wave 159 (N4) as UI-less. /admin/* writes are NOT members — they stay on the
// legacy /api face.
func isUserWritePath(path string) bool {
	// Membership is by path only; drop any query string.
	if i := strings.IndexByte(path, '?'); i >= 0 {
		path = path[:i]
	}
	switch path {
	case "/galgame/submit", "/galgame/image":
		return true
	}
	rest, ok := strings.CutPrefix(path, "/galgame/")
	if !ok {
		return false
	}
	// seg[0] must be a numeric galgame id — this excludes the read-only
	// siblings (/galgame/mine, /galgame/search, /galgame/messages/*, …), none
	// of which are writes anyway.
	seg := strings.Split(rest, "/")
	if _, err := strconv.Atoi(seg[0]); err != nil {
		return false
	}
	switch len(seg) {
	case 1: // PUT / PATCH / DELETE /galgame/:gid
		return true
	case 2: // POST /galgame/:gid/claim
		return seg[1] == "claim"
	}
	return false
}

// galgameResponse is the common envelope for all galgame JSON responses.
type galgameResponse[T any] struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    T      `json:"data"`
}

// Paginated is the shape of the data field in galgame paginated responses.
type Paginated[T any] struct {
	Items []T   `json:"items"`
	Total int64 `json:"total"`
}

// ─── Models (only the fields this project uses) ─────

// GalgameBrief is the lightweight galgame shape the enricher consumes. Since
// wave A2-2 it is sourced from the catalog works list
// (GET /v1/catalog/works?ids=&include=names,covers,refs) rather than the
// deprecated wiki batch face; the field set is unchanged except where the
// catalog genuinely has no counterpart (see ClaimState, and the retired
// user_id / resource_update_time — both wiki product state, which the registry
// refuses to mirror by design).
type GalgameBrief struct {
	// ID is the WIKI galgame id (gid) — moyu's own key space, read off the
	// catalog row's claim pointer. Zero when the work has no wiki entry, which
	// only the full-population lanes (calendar) can produce.
	ID int `json:"id"`
	// CatalogWorkID is the registry's own id for this work. Surfaced so a
	// consumer can deep-link the canonical record; moyu never keys on it (R3:
	// one id space per lane, and moyu's is the gid).
	CatalogWorkID int64  `json:"catalog_work_id,omitempty"`
	VndbID        string `json:"vndb_id"`
	// ClaimState is the catalog's claim VISIBILITY vocabulary — live | draft |
	// hidden, or "" when no wiki entry claims this work at all. It replaces the
	// wiki `status` int the deprecated face carried (A2-2 / R7).
	//
	// It is the ban gate: the deprecated face served status=0 only, so its
	// published-only filter silently doubled as moyu's "don't render withdrawn
	// entries" rule. Lanes that used to inherit that filter now gate on
	// state == live explicitly; the calendar, which deliberately surfaced
	// claimable drafts, keeps draft and drops only hidden.
	ClaimState       string  `json:"claim_state"`
	NameEnUs         string  `json:"name_en_us"`
	NameZhCn         string  `json:"name_zh_cn"`
	NameJaJp         string  `json:"name_ja_jp"`
	NameZhTw         string  `json:"name_zh_tw"`
	Banner           string  `json:"banner"`
	ContentLimit     string  `json:"content_limit"`
	AgeLimit         string  `json:"age_limit"`
	OriginalLanguage string  `json:"original_language"`
	ReleaseDate      *string `json:"release_date"`
	// ReleasePrecision marks how to read ReleaseDate (day/month/year).
	// ReleaseDate is NORMALIZED — a "2026-06-01" may be June 1st OR "some day in
	// June" — so this MUST be read alongside it. The catalog states the same
	// fact by carrying a partial-ISO date whose length is its precision; the
	// adapter re-splits it into this pair so moyu's own contract is unchanged.
	ReleasePrecision    string `json:"release_precision,omitempty"`
	EffectiveBannerHash string `json:"effective_banner_hash"`
	// EffectiveBanner{Width,Height,Thumbhash}: the pinned key art's intrinsic
	// metadata. Drives card aspect-ratio + ThumbHash blur-up on list/feed pages.
	EffectiveBannerWidth     int               `json:"effective_banner_width,omitempty"`
	EffectiveBannerHeight    int               `json:"effective_banner_height,omitempty"`
	EffectiveBannerThumbhash string            `json:"effective_banner_thumbhash,omitempty"`
	Covers                   []CoverInput      `json:"covers"`
	Screenshots              []ScreenshotInput `json:"screenshots"`
}

// GalgameHit is a single item returned from the works product search. It is a
// superset of the brief; the id-array fields have no counterpart on the search
// row and stay nil, exactly as they did on the deprecated face's thin item.
type GalgameHit struct {
	ID            int    `json:"id"`
	CatalogWorkID int64  `json:"catalog_work_id,omitempty"`
	VndbID        string `json:"vndb_id"`
	// ClaimState — see GalgameBrief.ClaimState.
	ClaimState               string            `json:"claim_state"`
	NameEnUs                 string            `json:"name_en_us"`
	NameZhCn                 string            `json:"name_zh_cn"`
	NameJaJp                 string            `json:"name_ja_jp"`
	NameZhTw                 string            `json:"name_zh_tw"`
	Banner                   string            `json:"banner"`
	ContentLimit             string            `json:"content_limit"`
	AgeLimit                 string            `json:"age_limit"`
	OriginalLanguage         string            `json:"original_language"`
	ReleaseDate              *string           `json:"release_date"`
	EffectiveBannerHash      string            `json:"effective_banner_hash"`
	EffectiveBannerWidth     int               `json:"effective_banner_width,omitempty"`
	EffectiveBannerHeight    int               `json:"effective_banner_height,omitempty"`
	EffectiveBannerThumbhash string            `json:"effective_banner_thumbhash,omitempty"`
	Covers                   []CoverInput      `json:"covers"`
	Screenshots              []ScreenshotInput `json:"screenshots"`
	TagIDs                   []int             `json:"tag_ids"`
	OfficialIDs              []int             `json:"official_ids"`
	EngineIDs                []int             `json:"engine_ids"`
}

// Tag is galgame's galgame_tag.
type Tag struct {
	ID           int      `json:"id"`
	Name         string   `json:"name"`
	Aliases      []string `json:"aliases"`
	Category     string   `json:"category"`
	GalgameCount int      `json:"galgame_count"`
}

// Official is galgame's galgame_official (developer/publisher).
type Official struct {
	ID           int      `json:"id"`
	Name         string   `json:"name"`
	Aliases      []string `json:"aliases"`
	Category     string   `json:"category"`
	Lang         string   `json:"lang"`
	Link         string   `json:"link"`
	Description  string   `json:"description"`
	GalgameCount int      `json:"galgame_count"`
}

// CoverInput / ScreenshotInput mirror the galgame cover/screenshot row shape
// (docs/galgame_wiki/03-relations.md §封面 / 截图). Used as both response
// element (galgame.covers / galgame.screenshots) and request element (PUT
// /galgame body covers/screenshots arrays) — identical fields, single round
// trip. ImageHash references image_service (no cross-service FK; the hash is
// guaranteed live via galgame refping).
//
// galgame PR5 (2026-05-18) replaced `banner_image_hash` with `covers[sort_order=0]`
// as the canonical "pinned banner"; the derived response field
// `effective_banner_hash` is the image_hash of that row (or empty if none).
type CoverInput struct {
	ImageHash string `json:"image_hash"`
	SortOrder int    `json:"sort_order"`
	Sexual    int    `json:"sexual"`
	Violence  int    `json:"violence"`
	Source    string `json:"source"`
	SourceKey string `json:"source_key"`
	// Kind is the VNDB cover type for covers (main/pkgfront/dig/pkgback/…); empty
	// for user uploads and for screenshots (which reuse this struct).
	Kind string `json:"kind,omitempty"`
	// Width/Height/Thumbhash are the image's intrinsic display metadata, filled
	// at read time by the galgame/galgame service from image_service (omitempty =
	// absent until the upstream backfill runs). moyu just parses + forwards them
	// so the frontend can reserve the correct aspect ratio and render a ThumbHash
	// blur-up placeholder. They are NOT request fields (ignored on PUT /galgame).
	Width     int    `json:"width,omitempty"`
	Height    int    `json:"height,omitempty"`
	Thumbhash string `json:"thumbhash,omitempty"`
}

type ScreenshotInput struct {
	ImageHash string `json:"image_hash"`
	SortOrder int    `json:"sort_order"`
	Caption   string `json:"caption"`
	Sexual    int    `json:"sexual"`
	Violence  int    `json:"violence"`
	Source    string `json:"source"`
	SourceKey string `json:"source_key"`
	// Width/Height/Thumbhash: transient image_service metadata (see CoverInput).
	Width     int    `json:"width,omitempty"`
	Height    int    `json:"height,omitempty"`
	Thumbhash string `json:"thumbhash,omitempty"`
}

// ─── Generic GET ─────────────────────────────────────

// get sends a GET request, parses the {code, message, data} envelope and unmarshals data into out.
//
// Reads route to the internal rich read face + X-API-Key (or fall back to the
// legacy /api face when no key is configured); see readTarget.
func (c *Client) get(ctx context.Context, path string, query url.Values, out any) error {
	base, apiKey := c.readTarget(path)
	u := base + path
	if len(query) > 0 {
		u += "?" + query.Encode()
	}

	req, err := http.NewRequestWithContext(ctx, "GET", u, nil)
	if err != nil {
		return fmt.Errorf("构造请求失败: %w", err)
	}
	if apiKey != "" {
		req.Header.Set("X-API-Key", apiKey)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("调用 galgame 失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("读取 galgame 响应失败: %w", err)
	}

	var wrapper galgameResponse[json.RawMessage]
	if err := json.Unmarshal(body, &wrapper); err != nil {
		return fmt.Errorf("解析 galgame 响应失败: %w (body=%s)", err, truncate(string(body), 200))
	}
	if wrapper.Code != 0 {
		return fmt.Errorf("galgame 业务错误 code=%d: %s", wrapper.Code, wrapper.Message)
	}
	if out == nil {
		return nil
	}
	if err := json.Unmarshal(wrapper.Data, out); err != nil {
		return fmt.Errorf("解析 galgame data 失败: %w", err)
	}
	return nil
}

// getV1Raw sends a GET to the /v1 public face ({base}/v1 + path), attaches the
// internal-tier X-API-Key, parses the {code,message,data} envelope and returns
// the raw `data` (so callers can reshape without an extra unmarshal). On a
// non-zero envelope code it returns *GalgameError carrying the wire code+message
// — so a downstream handler can forward the 404/business error verbatim, exactly
// like the doEnvelope write/proxy path. The /v1 face hard-depends on the key
// (galgame:read scope): an empty key yields a 401 the caller surfaces (same
// fail-fast contract as the internal read face).
func (c *Client) getV1Raw(ctx context.Context, path string, query url.Values) (json.RawMessage, error) {
	data, _, err := c.getV1RawStatus(ctx, path, query)
	return data, err
}

// getV1RawStatus is getV1Raw plus the HTTP status of the response (0 when the
// request never got one). Callers that must distinguish a DOCUMENTED 404 — the
// catalog face folds "no such external id" and "hidden work" into one 404 by
// design — from a genuine failure use this variant; everyone else uses getV1Raw.
//
// The status alone is NOT that distinction: judge the pair with catalogAbsent,
// which also demands the catalog's own error envelope. A 404 the router emitted
// carries a different body, and reading it as "absent" turns a broken path into
// an empty archive.
func (c *Client) getV1RawStatus(ctx context.Context, path string, query url.Values) (json.RawMessage, int, error) {
	u := c.v1Base + path
	if len(query) > 0 {
		u += "?" + query.Encode()
	}

	req, err := http.NewRequestWithContext(ctx, "GET", u, nil)
	if err != nil {
		return nil, 0, fmt.Errorf("构造请求失败: %w", err)
	}
	if c.apiKey != "" {
		req.Header.Set("X-API-Key", c.apiKey)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, 0, fmt.Errorf("调用 galgame 失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, resp.StatusCode, fmt.Errorf("读取 galgame 响应失败: %w", err)
	}

	var wrapper galgameResponse[json.RawMessage]
	if err := json.Unmarshal(body, &wrapper); err != nil {
		return nil, resp.StatusCode, fmt.Errorf("解析 galgame 响应失败: %w (body=%s)", err, truncate(string(body), 200))
	}
	if wrapper.Code != 0 {
		gerr := upstreamError(resp, wrapper.Code, wrapper.Message)
		// A merged id answers 301 + current_id. The target lives in the
		// envelope's data, which the error path would otherwise drop — and it
		// is the whole point of the answer, so it is lifted onto the verdict
		// here rather than re-fetched by whoever needs it.
		if wrapper.Code == catalogCodeMoved {
			var moved struct {
				CurrentID int64 `json:"current_id"`
			}
			if json.Unmarshal(wrapper.Data, &moved) == nil {
				gerr.Moved = moved.CurrentID
			}
		}
		return nil, resp.StatusCode, gerr
	}
	return wrapper.Data, resp.StatusCode, nil
}

// getV1 fetches the /v1 `data` (via getV1Raw) and unmarshals it into out.
func (c *Client) getV1(ctx context.Context, path string, query url.Values, out any) error {
	data, err := c.getV1Raw(ctx, path, query)
	if err != nil {
		return err
	}
	if out == nil {
		return nil
	}
	if err := json.Unmarshal(data, out); err != nil {
		return fmt.Errorf("解析 galgame data 失败: %w", err)
	}
	return nil
}

// ─── High-level methods ──────────────────────────────

// SearchGalgameParams are query parameters for the works product search.
//
// Since wave A2-2 these are projected onto GET /v1/catalog/works/search, whose
// filter names and types are the catalog works-list parameters verbatim. Two
// shape differences are enforced here rather than papered over:
//
//   - OfficialIDs / EngineIDs are at most ONE id each. The catalog expresses
//     `label_id=` / `engine_id=` as single values; ANDing several is not
//     something the face can do, so a longer list is a caller error the search
//     handler rejects loudly instead of quietly using the first.
//   - TagIDs are at most 10 (the catalog's own multi-value ceiling), ANDed.
//
// `Status` is gone: the catalog has no wiki status machine. The published-only
// population the old `status=0` selected is spelled `claim_state=live` on the
// outgoing query instead — a filter the SEARCH FACE applies, not this client.
//
// That sentence was written one wave before the parameter existed. What shipped
// in its place was a client-side post-filter on `renderable()`, which drops
// hidden claims only — so every unclaimed row in the registry (the dlsite /
// erogamespace bulk, tens of thousands of works with no wiki entry at all) and
// every unpublished draft reached the public result page. doc 106 §37.
type SearchGalgameParams struct {
	Q            string
	ContentLimit string // sfw / nsfw / all
	AgeLimit     string // all / r18
	OriginalLang string // csv of product locales, e.g. "ja-jp,en-us"
	TagIDs       []int
	OfficialIDs  []int
	EngineIDs    []int
	SeriesID     int
	ReleasedFrom int
	ReleasedTo   int
	// SearchIntro widens free-text matching from titles to SYNOPSES. It went
	// missing for one wave — the catalog works index carried titles only, so the
	// parameter was dropped rather than accepted and quietly ignored — and came
	// back with A2-1f. Default false keeps the narrow, high-precision behaviour;
	// a title hit always outranks a synopsis hit either way.
	SearchIntro bool
	Sort        string // relevance / released_desc / released_asc / updated / popularity
	Page        int
	Limit       int
}

// searchSortForCatalog maps moyu's sort token to the catalog search face's.
//
// `view` has no successor: the wiki counted moyu-side page views, which the
// registry does not keep. The catalog's `popularity` (log-damped upstream
// collect/download counts) is the ranking that replaced it, and the deprecated
// face already used popularity as its tiebreaker — so `view` maps there rather
// than 400-ing an existing caller.
func searchSortForCatalog(sort string) string {
	switch strings.TrimSpace(sort) {
	case "", "relevance":
		return ""
	case "view":
		return "popularity"
	default:
		return sort
	}
}

// SearchGalgame runs the works product search on GET /v1/catalog/works/search.
//
// EVERY gate this lane applies rides the querystring, and the response is passed
// through untouched. That is what makes `total` trustworthy: the catalog
// compiles one expression for total, items and facets alike, so the count and
// the page describe the same set. The deprecated face never held that property —
// the wiki search compiled its content filter into the re-hydration SQL but NOT
// into the Meili filter, so `total` counted rows the caller could not see.
//
// A second gate here would give that back. It did: for one wave this function
// dropped rows on `renderable()` AFTER the face had paged and counted them, so
// pages came back short under a total that no longer matched — and, because a
// missing claim is renderable, the filter let through the very population it
// was there to exclude. doc 106 §37. Add filters to `q`, never to the result.
func (c *Client) SearchGalgame(ctx context.Context, p SearchGalgameParams) (*Paginated[GalgameHit], error) {
	q := url.Values{}
	if p.Q != "" {
		q.Set("q", p.Q)
	}
	// The content axes, kept apart (doc 106 §38): content_limit is the EDITING
	// axis and rides `content_limit=`, while age_limit is the caller explicitly
	// asking for 18+ and is the one place the AGE axis (`content_rating=`) is
	// still spoken. They are independent filters and compose.
	gate := gateFor(p.ContentLimit)
	if p.AgeLimit == "r18" {
		gate.contentRating = "r18"
	}
	gate.apply(q)
	// The population axis: narrow the whole cross-media registry to works a
	// PUBLISHED wiki entry claims. `live` is the exact successor of the wiki's
	// `status=0` — it excludes hidden (withdrawn/banned) claims, unpublished
	// drafts and, decisively, the unclaimed majority of the registry.
	q.Set("claim_state", "live")

	if lang := joinCatalogLangs(p.OriginalLang); lang != "" {
		q.Set("olang", lang)
	}
	if len(p.TagIDs) > 0 {
		q.Set("tag_id", joinInts(p.TagIDs))
	}
	if len(p.OfficialIDs) > 0 {
		q.Set("label_id", strconv.Itoa(p.OfficialIDs[0]))
	}
	if len(p.EngineIDs) > 0 {
		q.Set("engine_id", strconv.Itoa(p.EngineIDs[0]))
	}
	if p.SeriesID > 0 {
		q.Set("series_id", strconv.Itoa(p.SeriesID))
	}
	// moyu's release filter is year-granular; the catalog's is a date bound.
	if p.ReleasedFrom > 0 {
		q.Set("released_after", yearLowerBound(p.ReleasedFrom))
	}
	if p.ReleasedTo > 0 {
		q.Set("released_before", yearUpperBound(p.ReleasedTo))
	}
	if p.SearchIntro {
		q.Set("search_intro", "1")
	}
	if s := searchSortForCatalog(p.Sort); s != "" {
		q.Set("sort", s)
	}
	if p.Page > 0 {
		q.Set("page", strconv.Itoa(p.Page))
	}
	if p.Limit > 0 {
		q.Set("limit", strconv.Itoa(p.Limit))
	}
	// names + refs lift the search row to the brief moyu renders: the four
	// localized titles, and the vndb anchor the caller joins its local patch
	// rows on. covers gives the card its key art.
	q.Set("include", "names,covers,refs")

	var data catalogWorksSearchData
	if err := c.getV1(ctx, "/catalog/works/search", q, &data); err != nil {
		return nil, err
	}
	out := Paginated[GalgameHit]{Total: data.Total}
	for i := range data.Items {
		out.Items = append(out.Items, catalogItemToHit(&data.Items[i]))
	}
	return &out, nil
}

// GalgameFullTag is one tag edge on a galgame detail record.
type GalgameFullTag struct {
	GalgameID int `json:"galgame_id"`
	TagID     int `json:"tag_id"`
	// SpoilerLevel is the EDGE's spoiler level (0 none / 1 minor / 2 major) —
	// per work-tag pair, not per tag. The catalog serves it as a first-class
	// field since A2-1e (R8); before that it was the wiki's own column.
	SpoilerLevel int `json:"spoiler_level"`
	Tag          Tag `json:"tag"`
}

// GalgameFullOfficial is one label ("official") attribution on a detail record.
type GalgameFullOfficial struct {
	GalgameID  int      `json:"galgame_id"`
	OfficialID int      `json:"official_id"`
	Official   Official `json:"official"`
}

// GalgameFull is the full galgame detail record used to enrich detail pages.
// Since wave A2-2 it is sourced from GET /v1/catalog/works/{id}.
//
// Three blocks the deprecated shape carried are gone because nothing read them
// and the catalog expresses them differently anyway: `alias` (the detail's
// alias rows — the edit-prefill lane that read them retired in A1), `engine`
// (moyu surfaced only the bare ids, which no frontend ever rendered) and `link`
// (same, retired with the links prefill lane). `view` and `series_id` go with
// them: view is a wiki counter the registry does not keep, and nothing read
// series_id.
type GalgameFull struct {
	ID            int    `json:"id"`
	CatalogWorkID int64  `json:"catalog_work_id,omitempty"`
	VndbID        string `json:"vndb_id"`
	// ClaimState — see GalgameBrief.ClaimState.
	ClaimState       string  `json:"claim_state"`
	NameEnUs         string  `json:"name_en_us"`
	NameZhCn         string  `json:"name_zh_cn"`
	NameJaJp         string  `json:"name_ja_jp"`
	NameZhTw         string  `json:"name_zh_tw"`
	Banner           string  `json:"banner"`
	IntroEnUs        string  `json:"intro_en_us"`
	IntroZhCn        string  `json:"intro_zh_cn"`
	IntroJaJp        string  `json:"intro_ja_jp"`
	IntroZhTw        string  `json:"intro_zh_tw"`
	ContentLimit     string  `json:"content_limit"`
	AgeLimit         string  `json:"age_limit"`
	OriginalLanguage string  `json:"original_language"`
	ReleaseDate      *string `json:"release_date"`

	Tag      []GalgameFullTag      `json:"tag"`
	Official []GalgameFullOfficial `json:"official"`

	EffectiveBannerHash string `json:"effective_banner_hash"`
	// EffectiveBanner{Width,Height,Thumbhash}: pinned key art's intrinsic
	// metadata. Drives the detail-page banner's aspect-ratio + blur-up.
	EffectiveBannerWidth     int               `json:"effective_banner_width,omitempty"`
	EffectiveBannerHeight    int               `json:"effective_banner_height,omitempty"`
	EffectiveBannerThumbhash string            `json:"effective_banner_thumbhash,omitempty"`
	Covers                   []CoverInput      `json:"covers"`
	Screenshots              []ScreenshotInput `json:"screenshots"`
	// Created is the REGISTRY row's creation instant, not the wiki entry's:
	// when this identity entered the catalog. It is the closest honest successor
	// to the wiki `created` the detail page used to print, and it is what the
	// catalog has (A2-1e / R9).
	Created string `json:"created"`
	Updated string `json:"updated"`
}

// GalgameDetailEnvelope is the data envelope for a galgame detail read.
type GalgameDetailEnvelope struct {
	Galgame GalgameFull `json:"galgame"`
}

// GetGalgame reads one work's detail; used to enrich detail pages.
//
// contentLimit is the EDITING-axis filter — "sfw" / "nsfw" match the entry's own
// content_limit exactly, "" / "all" apply no filter. A row that exists but fails
// the filter comes back as a not-found error, the same shape as a missing id, so
// every caller's 404 branch keeps its meaning.
func (c *Client) GetGalgame(ctx context.Context, gid int, contentLimit string) (*GalgameDetailEnvelope, error) {
	catalogID, found, err := c.resolveGID(ctx, gid)
	if err != nil {
		return nil, err
	}
	if !found {
		return nil, &GalgameError{Code: galgameCodeNotFound, Message: "galgame not found"}
	}

	gate := gateFor(contentLimit)
	q := url.Values{}
	// The work detail takes no filter parameters — only the visibility switch —
	// so the editing-axis gate is applied to the row it answers with, below.
	applyNSFW(q)
	// spoilers=2 asks for the COMPLETE tag set, spoiler-flagged rows included.
	// That is deliberate: moyu does its own spoiler filtering client-side (three
	// modes plus a "N hidden" counter), so it needs every edge and its level —
	// letting the face filter would silently empty the counter.
	q.Set("spoilers", "2")

	var w catalogWork
	if err := c.getV1(ctx, fmt.Sprintf("/catalog/works/%d", catalogID), q, &w); err != nil {
		return nil, err
	}
	// The deprecated detail served published entries only, so a draft or a
	// withdrawn entry read as 404 to every caller. Preserve that exactly: the
	// claim state is the successor of that filter.
	if !w.ClaimedBy.live() {
		return nil, &GalgameError{Code: galgameCodeNotFound, Message: "galgame not found"}
	}
	full := catalogWorkToFull(&w)
	// The editing-axis gate, applied to the single row because the detail face
	// carries no content_limit= parameter — and 404 is the same answer the wiki
	// detail gave on a content_limit miss, which is what every caller's
	// not-found branch already means. See catalogGate.allows for why this is not
	// the forbidden list-side re-filter.
	if !gate.allows(full.ContentLimit) {
		return nil, &GalgameError{Code: galgameCodeNotFound, Message: "galgame not found"}
	}
	return &GalgameDetailEnvelope{Galgame: full}, nil
}

// CheckGalgameByVndbID resolves a VNDB id to the wiki entry that owns it and
// returns (exists, galgame_id). Used as a pre-check by the patch service's
// vndb_id identity assertion and by the archive importer.
//
// It reads the CATALOG face — GET /v1/catalog/lookup?source=vndb&external_id=…
// — not the deprecated /v1/galgame/lookup: the catalog is the cross-media
// identity registry, and its `claimed_by` pointer is the authoritative
// "which product entry owns this external id" answer.
//
// DRAFT VISIBILITY IS LOAD-BEARING. ~52k of the catalog's ~63k galgames are
// unclaimed status=2 VNDB drafts, and this lookup MUST still resolve them —
// /v1 search, batch and detail all serve status=0 only, so it is the single
// read that answers for drafts. The new mechanism preserves that BY DESIGN:
// every wiki entry (drafts included) claims its catalog work at sync time, and
// the catalog's claimed_by projection is STATUS-BLIND — it reads
// catalog_work.{site,product_work_id} and never consults the wiki's status.
// If that ever changes, this degrades SILENTLY to "vndb not in catalog" for
// most of the archive (a skip, not an error). See the sibling incidents
// 8ce01e86 (publish picker) and f52b84d4.
//
// nsfw=1 is REQUIRED, always: without it the catalog hides r18 works behind the
// very same 404 as a miss, and moyu is largely an r18 patch site. moyu's
// internal-tier key carries the galgame:nsfw scope for exactly this.
//
// Semantics (bit-for-bit identical to the retired /v1/galgame/lookup):
//   - the DOCUMENTED 404 → (false, 0, nil): the catalog folds miss + hidden into
//     one 404. Only that one — see catalogAbsent, which insists on the catalog's
//     own error envelope so a route-level 404 surfaces as the failure it is
//     instead of reporting the whole archive absent.
//   - claimed_by == null → (false, 0, nil): the catalog knows this VNDB work but
//     NO wiki entry owns it, so there is no galgame id to return.
//   - claimed_by.site != galgame_wiki → (false, 0, nil): another product face
//     claimed it; its work_id is not a wiki gid (future-proofing).
func (c *Client) CheckGalgameByVndbID(ctx context.Context, vndbID string) (exists bool, galgameID int, err error) {
	q := url.Values{}
	q.Set("source", "vndb")
	q.Set("external_id", vndbID)
	q.Set("nsfw", "1")

	data, status, err := c.getV1RawStatus(ctx, "/catalog/lookup", q)
	if err != nil {
		if catalogAbsent(status, err) {
			return false, 0, nil
		}
		return false, 0, err
	}

	var out struct {
		ClaimedBy *struct {
			Site   string `json:"site"`
			WorkID int64  `json:"work_id"`
		} `json:"claimed_by"`
	}
	if err := json.Unmarshal(data, &out); err != nil {
		return false, 0, fmt.Errorf("解析 catalog lookup data 失败: %w", err)
	}
	if out.ClaimedBy == nil || out.ClaimedBy.Site != catalogSiteGalgameWiki {
		return false, 0, nil
	}
	return true, int(out.ClaimedBy.WorkID), nil
}

// BatchMaxIDs is the largest `ids` set GalgameBatch may be handed in one call.
//
// It is a WIRE LIMIT, not a tuning knob: both hops enforce it — the reverse
// lookup takes at most 100 pairs and GET /v1/catalog/works at most 100 ids, and
// each answers 400 rather than truncating. Callers that chunk MUST step by this
// constant.
//
// History worth keeping: the DEPRECATED batch face this replaced clamped with
// `if len(ids) > 100 { ids = ids[:100] }` — a silent truncation, so an
// over-long call came back short and indistinguishable from "the wiki doesn't
// have those ids". That is how the admin orphan view fabricated orphans for
// years. GalgameBatch now rejects an over-long slice itself rather than relying
// on the far side to complain.
const BatchMaxIDs = 100

// GalgameBatch fetches lightweight galgame info in bulk, keyed by gid.
//
// contentLimit is the EDITING-axis filter — "sfw" / "nsfw" match the entry's own
// content_limit exactly, "" / "all" apply no filter and return every requested
// id the caller may see.
// IMPORTANT: batch is intentionally permissive by default — the
// caller (typically holding patch.galgame_id, favorites, etc.) gets back every
// requested ID. When the moyu side wants list-style SFW filtering it MUST
// explicitly pass "sfw"; the returned slice will then be shorter than ids and
// the caller must reconcile (drop the filtered-out rows from its list).
func (c *Client) GalgameBatch(ctx context.Context, ids []int, contentLimit string) ([]GalgameBrief, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	if len(ids) > CatalogWorksIDsMax {
		return nil, fmt.Errorf("GalgameBatch: %d ids exceeds the %d-id ceiling — chunk by client.CatalogWorksIDsMax", len(ids), CatalogWorksIDsMax)
	}
	byGID, err := c.resolveGIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	if len(byGID) == 0 {
		return nil, nil
	}
	catalogIDs := make([]int64, 0, len(byGID))
	for _, id := range byGID {
		catalogIDs = append(catalogIDs, id)
	}

	q := url.Values{}
	q.Set("ids", joinInt64s(catalogIDs))
	// names + covers + refs is the exact set the brief maps from: the four
	// localized titles, the pinned key art with its dimensions/thumbhash, and
	// the vndb anchor.
	q.Set("include", "names,covers,refs")
	q.Set("limit", strconv.Itoa(CatalogWorksIDsMax))
	gateFor(contentLimit).apply(q)

	var data catalogWorksListData
	if err := c.getV1(ctx, "/catalog/works", q, &data); err != nil {
		return nil, err
	}
	out := make([]GalgameBrief, 0, len(data.Items))
	for i := range data.Items {
		it := &data.Items[i]
		// Published-only, exactly as the deprecated batch was: a draft or a
		// withdrawn wiki entry simply does not come back, and every caller's
		// "missing from the result" branch keeps its existing meaning.
		if !it.ClaimedBy.live() {
			continue
		}
		out = append(out, catalogItemToBrief(it))
	}
	return out, nil
}

// ─── Galgame release calendar (发售月历) ───────────────
// Precision-aware read-only endpoint for a "本月新作 / 发售月表" view.
// content_limit is EXACT-match on the editing axis here, as it is everywhere
// else; "" / "all" ask for no filter, which the catalog calendar expresses
// natively (the deprecated face could not, which is why the moyu handler still
// fans "all" out into two calls and merges them).

// GalgameCalendar is one ISO month of the release calendar (day + month
// precision, released + upcoming mixed, ascending by date).
type GalgameCalendar struct {
	Month string              `json:"month"`
	Today string              `json:"today"`
	Items []GalgameBrief      `json:"items"`
	Meta  GalgameCalendarMeta `json:"meta"`
}

// GalgameCalendarMeta carries the month-nav frame.
//
// MinMonth / MaxMonth are computed under the CALLER'S own population gates, so
// "the newest month with anything in it" means the newest month this caller can
// see something in — an sfw and an nsfw reader can legitimately differ.
type GalgameCalendarMeta struct {
	PrevMonth string `json:"prev_month"`
	NextMonth string `json:"next_month"`
	HasPrev   bool   `json:"has_prev"`
	HasNext   bool   `json:"has_next"`
	MinMonth  string `json:"min_month"`
	MaxMonth  string `json:"max_month"`
	Count     int    `json:"count"`
}

// calendarPageLimit is the calendar bucket's per-page ceiling. A month can hold
// more works than that under the full-catalog population, so the reader below
// walks the keyset cursor to exhaustion — the frontend groups the whole month by
// day and has no pagination of its own.
const calendarPageLimit = 100

// calendarMaxPages bounds that walk. At 100 rows a page this is 5,000 works in
// one month, which no month approaches; the bound exists so a cursor bug cannot
// turn one page render into an unbounded fetch loop.
const calendarMaxPages = 50

// GetGalgameCalendar fetches one ISO month from GET /v1/catalog/calendar. month
// is strict "YYYY-MM" or "" for the current month (JST, server-side).
//
// POPULATION CHANGE (refs/proj/126 P1, ratified): the bucket is now the whole
// catalog — every galgame the registry knows, not only the ~64k with a wiki
// entry. Works with no wiki entry come back with an empty ClaimState and no
// gid; the frontend renders them as "not on the forum yet" cards.
func (c *Client) GetGalgameCalendar(ctx context.Context, month, contentLimit string) (*GalgameCalendar, error) {
	out := &GalgameCalendar{}
	cursor := ""
	for page := 0; page < calendarMaxPages; page++ {
		q := url.Values{}
		if month != "" {
			q.Set("month", month)
		}
		q.Set("include", "names,covers,refs")
		q.Set("limit", strconv.Itoa(calendarPageLimit))
		if cursor != "" {
			q.Set("cursor", cursor)
		}
		gateFor(contentLimit).apply(q)

		var data catalogCalendarData
		if err := c.getV1(ctx, "/catalog/calendar", q, &data); err != nil {
			return nil, err
		}
		if page == 0 {
			out.Month = data.Month
			out.Today = data.Meta.Today
			out.Meta = GalgameCalendarMeta{
				PrevMonth: shiftMonth(data.Month, -1),
				NextMonth: shiftMonth(data.Month, +1),
				HasPrev:   derefBool(data.Meta.HasPrev),
				HasNext:   derefBool(data.Meta.HasNext),
				MinMonth:  data.Meta.MinMonth,
				MaxMonth:  data.Meta.MaxMonth,
				Count:     int(data.Count),
			}
		}
		for i := range data.Items {
			it := &data.Items[i]
			// A withdrawn wiki entry is never renderable. Drafts STAY — the
			// calendar has always surfaced claimable ones, and that is now
			// expressed by ClaimState == draft rather than by status == 2.
			if !it.ClaimedBy.renderable() {
				continue
			}
			out.Items = append(out.Items, catalogItemToBrief(it))
		}
		if data.NextCursor == nil || *data.NextCursor == "" {
			break
		}
		cursor = *data.NextCursor
	}
	return out, nil
}

// derefBool reads an optional wire bool, defaulting to false.
func derefBool(p *bool) bool { return p != nil && *p }

// shiftMonth moves a "YYYY-MM" by n months. The catalog's calendar meta answers
// whether a previous/next non-empty month EXISTS but not which one it is, and
// the month grid only ever steps by one — so the neighbour is arithmetic, not
// data, and computing it here keeps a round-trip off the page.
func shiftMonth(month string, n int) string {
	t, err := time.Parse("2006-01", month)
	if err != nil {
		return ""
	}
	return t.AddDate(0, n, 0).Format("2006-01")
}

// NOTE: the sibling "year-only, month TBD" (/calendar/pending) and "release date
// TBA" (/calendar/tba) buckets were retired in wave A1 — the FE only ever
// rendered the month lane, so the two client methods, their moyu handlers and
// their routes were census-verified dead and deleted. The month lane above is
// the whole calendar surface.

// GalgameMeta is one row of the ownership-meta batch: who owns a wiki entry and
// what state it is in. Deliberately NOT a brief — no cover, no intro, no
// release data. Ownership is not content.
type GalgameMeta struct {
	GID    int `json:"gid"`
	UserID int `json:"user_id"`
	// Status is the wiki's own state machine (0 published / 1 banned / 2 vndb
	// draft / 3 pending / 4 declined). It legitimately lives on this face — the
	// SURVIVING wiki face — and must never be read from the catalog, which
	// refuses to mirror another service's states (R2).
	Status int `json:"status"`
}

// GetGalgameMeta reads GET /internal/galgame/meta?ids= — the ownership-meta
// batch on the surviving platform-workflow face (A2-1e area B, R2 lane ①).
//
// moyu uses it for the WRITE lifecycle only: stamping a lazily-materialized
// stub row's placeholder owner, and the one-time backfill of the frozen
// entry-creator snapshot. Display lanes must NOT call it per read — the creator
// badge reads moyu's own snapshot column (R12), because wiki-era authorship is
// frozen at the archive and does not want a live dependency.
//
// It is STATUS-BLIND, which is exactly why it exists: the published-only reads
// answer nothing for an unpublished entry, so an owner assertion built on them
// degrades to "not the owner" and locks the true owner out.
func (c *Client) GetGalgameMeta(ctx context.Context, gids []int) ([]GalgameMeta, error) {
	if len(gids) == 0 {
		return nil, nil
	}
	if len(gids) > CatalogWorksIDsMax {
		return nil, fmt.Errorf("GetGalgameMeta: %d ids exceeds the %d-id ceiling", len(gids), CatalogWorksIDsMax)
	}
	var out struct {
		Items []GalgameMeta `json:"items"`
	}
	q := url.Values{}
	q.Set("ids", joinInts(gids))
	if err := c.get(ctx, "/galgame/meta", q, &out); err != nil {
		return nil, err
	}
	return out.Items, nil
}

// ─── Write methods (require user OAuth access_token) ───
//
// Per integration-guide.md §2, write operations are proxied through the site
// backend, but the user identity is carried by the user's OAuth access_token
// (the same one we already keep in the Redis session). The galgame service
// validates the JWT, extracts the userID, and enforces creator/admin rules
// itself — the patch backend does not need to re-implement authorization.

// UploadGalgameImage proxies a galgame cover/screenshot upload to the galgame's
// canonical POST /galgame/image (multipart {preset, file}), forwarding the
// user's OAuth access_token as Bearer. The galgame uploads under its OWN image
// client (site=galgame_wiki), so all galgame image bytes are owned by the galgame
// — moyu no longer uploads galgame images under its own site=moyu (which the
// site-scoped galgame reference-ping can't keep alive). Returns galgame's raw
// `data` (image_service UploadResult) on success, *GalgameError on a non-zero
// envelope code.
func (c *Client) UploadGalgameImage(
	ctx context.Context,
	accessToken string,
	preset, fileName string,
	fileContent []byte,
	fileMime string,
) (json.RawMessage, error) {
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	if err := w.WriteField("preset", preset); err != nil {
		return nil, fmt.Errorf("write preset field: %w", err)
	}
	h := make(textproto.MIMEHeader)
	h.Set("Content-Disposition",
		fmt.Sprintf(`form-data; name="file"; filename=%q`, fileName))
	if fileMime != "" {
		h.Set("Content-Type", fileMime)
	}
	fw, err := w.CreatePart(h)
	if err != nil {
		return nil, fmt.Errorf("create file part: %w", err)
	}
	if _, err := fw.Write(fileContent); err != nil {
		return nil, fmt.Errorf("write file part: %w", err)
	}
	if err := w.Close(); err != nil {
		return nil, fmt.Errorf("close multipart writer: %w", err)
	}

	base, apiKey := c.writeTarget("/galgame/image")
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, base+"/galgame/image", &buf)
	if err != nil {
		return nil, fmt.Errorf("build galgame upload request: %w", err)
	}
	if accessToken != "" {
		req.Header.Set("Authorization", "Bearer "+accessToken)
	}
	if apiKey != "" {
		req.Header.Set("X-API-Key", apiKey)
	}
	req.Header.Set("Content-Type", w.FormDataContentType())
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("galgame POST galgame image: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read galgame response: %w", err)
	}
	var env galgameResponse[json.RawMessage]
	if err := json.Unmarshal(raw, &env); err != nil {
		return nil, fmt.Errorf("decode galgame envelope: %w (body=%s)", err, truncate(string(raw), 200))
	}
	if env.Code != 0 {
		return nil, upstreamError(resp, env.Code, env.Message)
	}
	return env.Data, nil
}

// ─── helpers ─────────────────────────────────────────

func joinInts(xs []int) string {
	parts := make([]string, 0, len(xs))
	for _, x := range xs {
		parts = append(parts, strconv.Itoa(x))
	}
	return strings.Join(parts, ",")
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}

// GalgameUserStats is the subset of /galgame/user/:id/stats used for creator
// eligibility (merged PRs + published galgames).
type GalgameUserStats struct {
	GalgameCreated int64 `json:"galgame_created"`
	PRMerged       int64 `json:"pr_merged"`
}

// GetUserStats fetches a user's galgame contribution stats from the galgame.
func (c *Client) GetUserStats(ctx context.Context, userID int) (*GalgameUserStats, error) {
	var stats GalgameUserStats
	if err := c.get(ctx, fmt.Sprintf("/galgame/user/%d/stats", userID), nil, &stats); err != nil {
		return nil, err
	}
	return &stats, nil
}
