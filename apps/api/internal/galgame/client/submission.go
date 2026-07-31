package client

// This file implements the user-submission + admin-review flow described in
// docs/galgame_wiki/07-submission.md and 08-messages.md. The split from
// client.go is purely organizational — all methods belong to *Client.
//
// Two auth modes are at play:
//   - User-facing methods (Submit / Claim / PatchDraft / DeleteDraft / ListMine /
//     SearchWithPending / MyMessages) transparently forward the user's OAuth
//     access_token. galgame decodes the JWT itself; this site never re-decides
//     identity. Since open-API phase 2 wave 06a the write members (Submit /
//     Claim / PatchDraft / DeleteDraft) also ride the internal face and so carry
//     the internal-tier X-API-Key alongside the Bearer (dual credential) — see
//     writeTarget in client.go.
//   - Server-to-server (MessageFeed) uses the internal-tier X-API-Key on the
//     internal face — the same key every other read carries.

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"net/url"
	"strconv"
)

// ─── DTOs ──────────────────────────────────────────────

// SubmitGalgameRequest is the JSON body of POST /galgame/submit. All fields
// are pointers so callers can omit them (galgame applies its own defaults).
//
// U1: ReleaseDate / ReleaseDateTBA replace the old `released string`.
// W2 / galgame PR5: BannerImageHash dropped — banner via multipart `file` (auto
// promoted to covers[sort_order=0]) or explicit covers array.
// Covers / Screenshots are presence-replace: send the key to replace the whole
// set, omit it to keep what is there.
type SubmitGalgameRequest struct {
	VndbID           *string            `json:"vndb_id,omitempty"`
	NameEnUs         *string            `json:"name_en_us,omitempty"`
	NameJaJp         *string            `json:"name_ja_jp,omitempty"`
	NameZhCn         *string            `json:"name_zh_cn,omitempty"`
	NameZhTw         *string            `json:"name_zh_tw,omitempty"`
	Banner           *string            `json:"banner,omitempty"`
	IntroEnUs        *string            `json:"intro_en_us,omitempty"`
	IntroJaJp        *string            `json:"intro_ja_jp,omitempty"`
	IntroZhCn        *string            `json:"intro_zh_cn,omitempty"`
	IntroZhTw        *string            `json:"intro_zh_tw,omitempty"`
	ContentLimit     *string            `json:"content_limit,omitempty"`
	OriginalLanguage *string            `json:"original_language,omitempty"`
	AgeLimit         *string            `json:"age_limit,omitempty"`
	ReleaseDate      *string            `json:"release_date,omitempty"`
	ReleaseDateTBA   *bool              `json:"release_date_tba,omitempty"`
	SeriesID         *int               `json:"series_id,omitempty"`
	Aliases          *string            `json:"aliases,omitempty"`
	TagIDs           *[]int             `json:"tag_ids,omitempty"`
	OfficialIDs      *[]int             `json:"official_ids,omitempty"`
	EngineIDs        *[]int             `json:"engine_ids,omitempty"`
	Covers           *[]CoverInput      `json:"covers,omitempty"`
	Screenshots      *[]ScreenshotInput `json:"screenshots,omitempty"`
}

// MineItem mirrors one entry returned by GET /galgame/mine. Only the
// columns relevant to the "my submissions" page are typed; decline_reason is
// present only on status=4 rows.
type MineItem struct {
	ID                  int    `json:"id"`
	Status              int    `json:"status"`
	VndbID              string `json:"vndb_id"`
	NameEnUs            string `json:"name_en_us"`
	NameJaJp            string `json:"name_ja_jp"`
	NameZhCn            string `json:"name_zh_cn"`
	NameZhTw            string `json:"name_zh_tw"`
	Banner              string `json:"banner"`
	EffectiveBannerHash string `json:"effective_banner_hash"`
	ContentLimit        string `json:"content_limit"`
	Created             string `json:"created"`
	Updated             string `json:"updated"`
	DeclineReason       string `json:"decline_reason,omitempty"`
}

// MessageGalgame is the embedded galgame brief on a galgame message. It may
// be nil if the galgame was hard-deleted between event emission and read.
type MessageGalgame struct {
	ID                  int    `json:"id"`
	NameEnUs            string `json:"name_en_us"`
	NameJaJp            string `json:"name_ja_jp"`
	NameZhCn            string `json:"name_zh_cn"`
	NameZhTw            string `json:"name_zh_tw"`
	Banner              string `json:"banner"`
	EffectiveBannerHash string `json:"effective_banner_hash"`
	Status              int    `json:"status"`
	UserID              int    `json:"user_id"`
}

// GalgameMessage is one entry from /galgame/messages/mine or /galgame/messages/feed.
type GalgameMessage struct {
	ID           int64           `json:"id"`
	Type         string          `json:"type"`
	GalgameID    int             `json:"galgame_id"`
	Galgame      *MessageGalgame `json:"galgame,omitempty"`
	ActorUserID  *int            `json:"actor_user_id,omitempty"`
	TargetUserID *int            `json:"target_user_id,omitempty"`
	Payload      json.RawMessage `json:"payload,omitempty"`
	CreatedAt    string          `json:"created_at"`
}

// SearchPending is the publish wizard's payload. The two arrays are answered by
// two different faces and mean two different things; see
// SearchGalgameForPublish for why they cannot be merged.
type SearchPending struct {
	Items   []GalgameHit        `json:"items"`
	Pending []GalgamePendingHit `json:"pending"`
	Total   int64               `json:"total"`
}

// GalgamePendingHit is one of the caller's OWN unpublished submissions, as
// surfaced by /galgame/search?include_pending=true.
//
// It is deliberately NOT a GalgameHit. A hit is a registry row and carries
// `claim_state`; this is a wiki-side workflow row whose whole reason to be on
// screen is its position in the wiki's review machine — 3 审核中 vs 4 已拒绝,
// which the wizard prints verbatim and the catalog has no successor for
// (`claim_state` collapses both onto `draft`). Decoding this half into
// GalgameHit dropped `status` on the floor and the block has been labelling
// every row 已拒绝 ever since.
type GalgamePendingHit struct {
	ID     int    `json:"id"`
	VndbID string `json:"vndb_id"`
	// Status is the wiki state machine: 3 = pending review, 4 = declined.
	Status              int    `json:"status"`
	NameEnUs            string `json:"name_en_us"`
	NameZhCn            string `json:"name_zh_cn"`
	NameJaJp            string `json:"name_ja_jp"`
	NameZhTw            string `json:"name_zh_tw"`
	Banner              string `json:"banner"`
	EffectiveBannerHash string `json:"effective_banner_hash"`
}

// ─── User-facing methods (transparent JWT forwarding) ──

// SubmitGalgame proxies POST /galgame/submit in JSON mode. Use
// SubmitGalgameMultipart when the user also uploads a banner file.
func (c *Client) SubmitGalgame(ctx context.Context, accessToken string, body any) (json.RawMessage, error) {
	return c.writeUserJSON(ctx, http.MethodPost, "/galgame/submit", accessToken, body)
}

// SubmitGalgameMultipart proxies POST /galgame/submit in multipart mode. The
// `data` part is the JSON body, the `file` part is the optional banner image.
func (c *Client) SubmitGalgameMultipart(
	ctx context.Context,
	accessToken string,
	jsonBody any,
	fileName string,
	fileContent []byte,
	fileMime string,
) (json.RawMessage, error) {
	return c.writeUserMultipart(ctx, http.MethodPost, "/galgame/submit",
		accessToken, jsonBody, fileName, fileContent, fileMime)
}

// ClaimGalgame proxies POST /galgame/:gid/claim — claim a VNDB draft (status=2)
// and immediately publish it (status=0). Returns the published galgame.
func (c *Client) ClaimGalgame(ctx context.Context, accessToken string, gid int) (json.RawMessage, error) {
	return c.writeUserJSON(ctx, http.MethodPost,
		fmt.Sprintf("/galgame/%d/claim", gid), accessToken, map[string]any{})
}

// PatchGalgameDraft proxies PATCH /galgame/:gid (status ∈ {3,4}). Editing
// a declined draft auto-flips it back to pending review.
func (c *Client) PatchGalgameDraft(ctx context.Context, accessToken string, gid int, body any) (json.RawMessage, error) {
	return c.writeUserJSON(ctx, http.MethodPatch,
		fmt.Sprintf("/galgame/%d", gid), accessToken, body)
}

// PatchGalgameDraftMultipart proxies PATCH /galgame/:gid with a new banner file.
func (c *Client) PatchGalgameDraftMultipart(
	ctx context.Context,
	accessToken string,
	gid int,
	jsonBody any,
	fileName string,
	fileContent []byte,
	fileMime string,
) (json.RawMessage, error) {
	return c.writeUserMultipart(ctx, http.MethodPatch,
		fmt.Sprintf("/galgame/%d", gid),
		accessToken, jsonBody, fileName, fileContent, fileMime)
}

// DeleteGalgameDraft proxies DELETE /galgame/:gid (hard delete, status ∈ {3,4}).
func (c *Client) DeleteGalgameDraft(ctx context.Context, accessToken string, gid int) error {
	path := fmt.Sprintf("/galgame/%d", gid)
	base, apiKey := c.writeTarget(path)
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, base+path, nil)
	if err != nil {
		return fmt.Errorf("build galgame delete: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	if apiKey != "" {
		req.Header.Set("X-API-Key", apiKey)
	}
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("galgame DELETE draft: %w", err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read galgame delete response: %w", err)
	}
	var env galgameResponse[json.RawMessage]
	if err := json.Unmarshal(raw, &env); err != nil {
		return fmt.Errorf("decode galgame envelope: %w (body=%s)", err, truncate(string(raw), 200))
	}
	if env.Code != 0 {
		return upstreamError(resp, env.Code, env.Message)
	}
	return nil
}

// ListMyGalgames proxies GET /galgame/mine. Status filter is csv (default "3,4"
// when the caller passes an empty string).
func (c *Client) ListMyGalgames(ctx context.Context, accessToken string, status string, page, limit int) (*Paginated[MineItem], error) {
	q := url.Values{}
	if status != "" {
		q.Set("status", status)
	}
	if page > 0 {
		q.Set("page", strconv.Itoa(page))
	}
	if limit > 0 {
		q.Set("limit", strconv.Itoa(limit))
	}
	base, apiKey := c.readTarget("/galgame/mine")
	u := base + "/galgame/mine"
	if len(q) > 0 {
		u += "?" + q.Encode()
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, fmt.Errorf("build galgame /galgame/mine: %w", err)
	}
	// Dual credential: the user JWT rides Authorization; the service key (when
	// configured) rides X-API-Key on the internal read face.
	req.Header.Set("Authorization", "Bearer "+accessToken)
	if apiKey != "" {
		req.Header.Set("X-API-Key", apiKey)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("galgame /galgame/mine: %w", err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read galgame response: %w", err)
	}
	var env galgameResponse[Paginated[MineItem]]
	if err := json.Unmarshal(raw, &env); err != nil {
		return nil, fmt.Errorf("decode galgame envelope: %w (body=%s)", err, truncate(string(raw), 200))
	}
	if env.Code != 0 {
		return nil, upstreamError(resp, env.Code, env.Message)
	}
	if env.Data.Items == nil {
		env.Data.Items = []MineItem{}
	}
	return &env.Data, nil
}

// publishWizardClaimStates is the population the publish wizard has to see:
// every work a wiki entry claims, published or not. Public browse lanes want
// `live` alone (doc 106 §37) — this is the deliberate exception, because the
// wizard exists to prevent a second submission of something that already
// exists, and an entry it cannot see is an entry that gets submitted twice.
//
// `pending` is asked for even though nothing produces it yet (see
// catalogClaimStatePending). That ordering is the point: the registry's
// projector splits "someone else's submission under review" out of `draft` in
// the W1 window, and if this query only learned the word afterwards, those rows
// would drop out of the wizard's dedup supply for the length of a deploy gap —
// which is exactly the shape that mints duplicate submissions.
const publishWizardClaimStates = catalogClaimStateLive + "," +
	catalogClaimStateDraft + "," + catalogClaimStatePending

// SearchGalgameForPublish answers the publish wizard. It is TWO upstream reads
// and they are not interchangeable:
//
//   - `items` is the catalog works search with claim_state=live,draft,pending — the
//     registry is the supply of record for "does this game already exist". This
//     replaced the wiki face's status=0,2 search once the works index recalled
//     CJK titles as well as the wiki one did (wave 158).
//   - `pending` is the caller's OWN status ∈ {3,4} submissions, which only the
//     wiki face can answer: the catalog has no per-user read face for that
//     backlog (the rows all predate the claim-event log), so this half keeps
//     its original query byte for byte.
//
// The one accepted difference in `items`: the catalog projects wiki status 2
// (unclaimed VNDB draft) and status 3 (SOMEONE ELSE's submission under review)
// onto the same `draft` state and cannot tell them apart, so the wizard shows
// both as claimable. Attempting the claim is what discovers the difference —
// the wiki refuses it — and the wizard says so on screen. The registry's
// projector splits status 3 out as `pending` in the W1 window, which is why
// that state is already in the query above and already has a badge on the page:
// the fix arrives as rows appearing under a word both sides already speak.
//
// The history this replaces is worth keeping: open-API phase 2 wave 07
// (e8927569) moved this lane onto a published-only /v1 read, which hid 52k of
// the catalog's 63k entries from the picker. Every unclaimed VNDB game fell
// through to "没有找到匹配的条目", users hit 提交新作, and blank duplicates of
// existing drafts were created (prod 2026-07-24: galgame 63091/63092/63097/
// 63098 duplicated 13555/10143/27451/9867). `claim_state` is the parameter that
// makes this face serviceable; without it the lane must stay on the wiki.
func (c *Client) SearchGalgameForPublish(ctx context.Context, accessToken, q string, limit int) (*SearchPending, error) {
	items, total, err := c.searchPublishItems(ctx, q, limit)
	if err != nil {
		return nil, err
	}
	pending, err := c.searchPublishPending(ctx, accessToken, q, limit)
	if err != nil {
		return nil, err
	}
	return &SearchPending{Items: items, Pending: pending, Total: total}, nil
}

// searchPublishItems runs the registry half.
//
// Only the AGE gate is opened — exactly as the wiki lane had it. The wizard is
// a dedup tool for an authenticated submitter, not a browse surface, so
// narrowing its supply by an editorial preference would hide the very entries
// it exists to surface.
func (c *Client) searchPublishItems(ctx context.Context, q string, limit int) ([]GalgameHit, int64, error) {
	params := url.Values{}
	if q != "" {
		params.Set("q", q)
	}
	if limit > 0 {
		params.Set("limit", strconv.Itoa(limit))
	}
	// claimed=true is the gid requirement: an unclaimed registry row has no
	// wiki id, and every wizard action (关联 / 认领) is keyed by one.
	params.Set("claimed", "true")
	params.Set("claim_state", publishWizardClaimStates)
	params.Set("include", "names,covers,refs")
	gateFor("").apply(params)

	var data catalogWorksSearchData
	if err := c.getV1(ctx, "/catalog/works/search", params, &data); err != nil {
		return nil, 0, err
	}
	items := make([]GalgameHit, 0, len(data.Items))
	for i := range data.Items {
		row := &data.Items[i]
		// A withdrawn claim must never be offered for 认领, and a row with no
		// gid has no action at all. claimed=true should already exclude the
		// latter; this is the same belt the other claim-bearing lanes wear.
		if !row.ClaimedBy.renderable() || row.ClaimedBy.gid() == 0 {
			continue
		}
		items = append(items, catalogItemToHit(row))
	}
	return items, data.Total, nil
}

// searchPublishPending runs the wiki half — the caller's own submissions. The
// query is the pre-switchover one unchanged: the face merges the caller's hits
// only while serving a real search, so the search parameters have to be there
// even though we keep just the `pending` array.
func (c *Client) searchPublishPending(ctx context.Context, accessToken, q string, limit int) ([]GalgamePendingHit, error) {
	params := url.Values{}
	if q != "" {
		params.Set("q", q)
	}
	if limit > 0 {
		params.Set("limit", strconv.Itoa(limit))
	}
	params.Set("include_pending", "true")
	params.Set("status", "0,2")
	params.Set("facets", "false")
	params.Set("highlight", "false")

	base, apiKey := c.readTarget("/galgame/search")
	u := base + "/galgame/search?" + params.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, fmt.Errorf("build galgame search: %w", err)
	}
	// Dual credential: the (optional) user JWT rides Authorization to surface
	// the caller's own pending drafts; the service key rides X-API-Key.
	if accessToken != "" {
		req.Header.Set("Authorization", "Bearer "+accessToken)
	}
	if apiKey != "" {
		req.Header.Set("X-API-Key", apiKey)
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("galgame search: %w", err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read galgame response: %w", err)
	}
	var env galgameResponse[SearchPending]
	if err := json.Unmarshal(raw, &env); err != nil {
		return nil, fmt.Errorf("decode galgame envelope: %w (body=%s)", err, truncate(string(raw), 200))
	}
	if env.Code != 0 {
		return nil, upstreamError(resp, env.Code, env.Message)
	}
	// A nil slice marshals back to JSON `null`, which crashes frontend code
	// doing `results.pending.length`. Guarantee `[]`.
	if env.Data.Pending == nil {
		return []GalgamePendingHit{}, nil
	}
	return env.Data.Pending, nil
}

// ─── Service-to-service (internal-tier X-API-Key) ──────

// GalgameMessageFeedResult is the decoded `data` payload of /galgame/messages/feed.
type GalgameMessageFeedResult struct {
	Items   []GalgameMessage `json:"items"`
	HasMore bool             `json:"has_more"`
}

// GetGalgameMessageFeed proxies GET /galgame/messages/feed for the cron job.
// Authenticated via the internal-tier X-API-Key on the internal read face — the
// same key every other read carries (the legacy /api Basic-Auth feed retired in
// open-API phase 2 wave 05).
func (c *Client) GetGalgameMessageFeed(ctx context.Context, sinceID int64, limit int) (*GalgameMessageFeedResult, error) {
	if c.apiKey == "" {
		return nil, fmt.Errorf("galgame message feed: internal-tier API key not configured (KUN_NEXTMOE_API_KEY)")
	}
	q := url.Values{}
	if sinceID > 0 {
		q.Set("since_id", strconv.FormatInt(sinceID, 10))
	}
	if limit > 0 {
		q.Set("limit", strconv.Itoa(limit))
	}
	u := c.internalBase + "/galgame/messages/feed"
	if len(q) > 0 {
		u += "?" + q.Encode()
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, fmt.Errorf("build galgame /messages/feed: %w", err)
	}
	req.Header.Set("X-API-Key", c.apiKey)

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("galgame /messages/feed: %w", err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read galgame response: %w", err)
	}
	var env galgameResponse[GalgameMessageFeedResult]
	if err := json.Unmarshal(raw, &env); err != nil {
		return nil, fmt.Errorf("decode galgame envelope: %w (body=%s)", err, truncate(string(raw), 200))
	}
	if env.Code != 0 {
		return nil, upstreamError(resp, env.Code, env.Message)
	}
	return &env.Data, nil
}

// ─── shared write helpers ──────────────────────────────

func (c *Client) writeUserJSON(ctx context.Context, method, path, accessToken string, body any) (json.RawMessage, error) {
	payload, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("encode body: %w", err)
	}
	base, apiKey := c.writeTarget(path)
	req, err := http.NewRequestWithContext(ctx, method, base+path, bytes.NewReader(payload))
	if err != nil {
		return nil, fmt.Errorf("build galgame %s %s: %w", method, path, err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	if apiKey != "" {
		req.Header.Set("X-API-Key", apiKey)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("galgame %s %s: %w", method, path, err)
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

func (c *Client) writeUserMultipart(
	ctx context.Context,
	method, path, accessToken string,
	jsonBody any,
	fileName string,
	fileContent []byte,
	fileMime string,
) (json.RawMessage, error) {
	payload, err := json.Marshal(jsonBody)
	if err != nil {
		return nil, fmt.Errorf("encode body: %w", err)
	}
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	if err := w.WriteField("data", string(payload)); err != nil {
		return nil, fmt.Errorf("write data field: %w", err)
	}
	if len(fileContent) > 0 {
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
	}
	if err := w.Close(); err != nil {
		return nil, fmt.Errorf("close multipart writer: %w", err)
	}

	base, apiKey := c.writeTarget(path)
	req, err := http.NewRequestWithContext(ctx, method, base+path, &buf)
	if err != nil {
		return nil, fmt.Errorf("build galgame %s %s: %w", method, path, err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	if apiKey != "" {
		req.Header.Set("X-API-Key", apiKey)
	}
	req.Header.Set("Content-Type", w.FormDataContentType())
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("galgame %s %s (multipart): %w", method, path, err)
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
