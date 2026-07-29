package client

// The gid <-> catalog work id bridge (wave A2-2).
//
// moyu is gid-native: `patch.id` IS the wiki galgame id (the D13 remap), it is
// burned into every local key, every URL and every foreign key. The catalog
// addresses works by its OWN id, and `works?ids=` takes catalog ids only.
// Nothing in moyu stores a catalog work id and — per refs/proj/106 R3 —
// nothing should: carrying two id spaces through one lane is precisely the
// failure mode that ruling forbids.
//
// So every read that starts from a gid resolves through the catalog's reverse
// lookup first: POST /v1/catalog/lookup/batch with {source: galgame_wiki,
// external_id: <gid>}. That is the two-hop cost R3 explicitly accepted. Two
// things keep it cheap:
//
//   - The mapping is an IDENTITY, not content: a gid resolves to the same
//     catalog work forever (merges emit redirects rather than repointing), so
//     it caches safely in-process.
//   - The hydration call returns `claimed_by` itself, so the VOLATILE half —
//     the claim's visibility state — is always read fresh from the second hop
//     and never served from this cache. Caching a stale `live` would keep a
//     banned entry renderable, which is the one error this wave exists to
//     prevent.

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"
)

// catalogLookupBatchMax is the reverse lookup's documented pair ceiling. Over
// it the catalog answers 400 (it does NOT silently truncate, unlike the
// deprecated batch face) — so this is a chunking size, not a hope.
const catalogLookupBatchMax = 100

// CatalogWorksIDsMax is the `ids=` ceiling on GET /v1/catalog/works. Same
// value, same posture: 400 on excess, never a short answer that reads as
// "those works do not exist".
const CatalogWorksIDsMax = 100

// gidMapTTL bounds how long a resolved gid -> catalog id pair is reused. The
// mapping is stable, so this is not a correctness window — it exists so that a
// catalog-side merge (which retires an id in favour of a redirect target)
// propagates on its own within an hour instead of living for the process's
// lifetime.
const gidMapTTL = time.Hour

// gidMapMaxEntries caps the in-process map. moyu pages at <=100 rows, so the
// working set is small; the cap only guards against a crawler walking the whole
// archive and pinning 64k entries in memory forever.
const gidMapMaxEntries = 20000

type gidMapEntry struct {
	catalogID int64
	at        time.Time
}

// gidMap is the process-local gid -> catalog work id cache described above.
type gidMap struct {
	mu sync.RWMutex
	m  map[int]gidMapEntry
}

func newGIDMap() *gidMap { return &gidMap{m: map[int]gidMapEntry{}} }

func (g *gidMap) get(gid int) (int64, bool) {
	g.mu.RLock()
	e, ok := g.m[gid]
	g.mu.RUnlock()
	if !ok || time.Since(e.at) > gidMapTTL {
		return 0, false
	}
	return e.catalogID, true
}

func (g *gidMap) put(gid int, catalogID int64) {
	g.mu.Lock()
	defer g.mu.Unlock()
	// Drop everything rather than evict cleverly: the map is a latency
	// optimization over an idempotent lookup, so a cold restart costs one extra
	// round-trip per page and nothing else.
	if len(g.m) >= gidMapMaxEntries {
		g.m = make(map[int]gidMapEntry, gidMapMaxEntries/4)
	}
	g.m[gid] = gidMapEntry{catalogID: catalogID, at: time.Now()}
}

// ─── content gating ───────────────────────────────────────────────────────

// catalogGate is the catalog-side rendering of one moyu content_limit value.
//
// moyu inherited a two-axis convention from the wiki (content_limit sfw|nsfw
// plus a separate age_limit); the catalog has ONE axis, content_rating
// (all_ages | sensitive | r18), plus the caller-controlled `nsfw` switch that
// decides whether r18 rows are visible at all. The projection:
//
//	""     -> nsfw=1, no rating filter  (moyu's permissive default: return the
//	                                     row whatever its grading)
//	"all"  -> nsfw=1, no rating filter
//	"sfw"  -> nsfw=0                    (r18 hidden by the face itself)
//	"nsfw" -> nsfw=1 + content_rating=r18 (r18 ONLY — the deprecated face's
//	                                     exact-match semantics)
//
// `sensitive` has no wiki counterpart and falls on the sfw side, which is where
// the wiki's own sfw grading put that material.
type catalogGate struct {
	nsfw          bool
	contentRating string // "" = no filter
}

func gateFor(contentLimit string) catalogGate {
	switch strings.ToLower(strings.TrimSpace(contentLimit)) {
	case "sfw":
		return catalogGate{nsfw: false}
	case "nsfw":
		return catalogGate{nsfw: true, contentRating: "r18"}
	default: // "" and "all"
		return catalogGate{nsfw: true}
	}
}

// apply writes the gate onto a query.
func (g catalogGate) apply(q url.Values) {
	if g.nsfw {
		q.Set("nsfw", "1")
	}
	if g.contentRating != "" {
		q.Set("content_rating", g.contentRating)
	}
}

// ─── the /v1 POST channel ─────────────────────────────────────────────────

// postV1 sends a JSON POST to the /v1 face and returns the envelope's raw
// `data`. The reverse lookup's batch form is the only POST moyu makes on a READ
// face — it is a read whose request body is too large for a query string.
func (c *Client) postV1(ctx context.Context, path string, body any) (json.RawMessage, error) {
	payload, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("编码 catalog 请求体失败: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.v1Base+path, bytes.NewReader(payload))
	if err != nil {
		return nil, fmt.Errorf("构造请求失败: %w", err)
	}
	if c.apiKey != "" {
		req.Header.Set("X-API-Key", c.apiKey)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("调用 catalog 失败: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取 catalog 响应失败: %w", err)
	}
	var env galgameResponse[json.RawMessage]
	if err := json.Unmarshal(raw, &env); err != nil {
		return nil, fmt.Errorf("解析 catalog 响应失败: %w (body=%s)", err, truncate(string(raw), 200))
	}
	if env.Code != 0 {
		return nil, &GalgameError{Code: env.Code, Message: env.Message}
	}
	return env.Data, nil
}

// ─── resolution ───────────────────────────────────────────────────────────

// resolveGIDs maps wiki gids to catalog work ids, consulting the cache first
// and batching the misses through POST /v1/catalog/lookup/batch. Unresolvable
// gids are simply absent from the result (a gid the catalog has never
// registered is not an error — it is a work moyu knows about and the registry
// does not yet).
//
// The lookup always runs with nsfw=1: this hop resolves IDENTITY, and letting
// the sfw gate fold an r18 work into a miss here would make it indistinguishable
// from "no such gid". Content gating belongs on the hydration hop, which applies
// it to the rows it actually returns.
func (c *Client) resolveGIDs(ctx context.Context, gids []int) (map[int]int64, error) {
	out := make(map[int]int64, len(gids))
	var missing []int
	for _, gid := range gids {
		if gid <= 0 {
			continue
		}
		if id, ok := c.gids.get(gid); ok {
			out[gid] = id
			continue
		}
		missing = append(missing, gid)
	}
	for start := 0; start < len(missing); start += catalogLookupBatchMax {
		end := min(start+catalogLookupBatchMax, len(missing))
		chunk := missing[start:end]

		body := catalogLookupBatchRequest{Items: make([]catalogLookupPair, 0, len(chunk))}
		for _, gid := range chunk {
			body.Items = append(body.Items, catalogLookupPair{
				Source: catalogSiteGalgameWiki, ExternalID: strconv.Itoa(gid),
			})
		}
		raw, err := c.postV1(ctx, "/catalog/lookup/batch?nsfw=1", body)
		if err != nil {
			return nil, err
		}
		var data catalogLookupBatchData
		if err := json.Unmarshal(raw, &data); err != nil {
			return nil, fmt.Errorf("解析 catalog lookup batch data 失败: %w", err)
		}
		for i := range data.Items {
			it := &data.Items[i]
			if it.Work == nil {
				continue
			}
			gid, err := strconv.Atoi(it.ExternalID)
			if err != nil {
				continue
			}
			out[gid] = it.Work.ID
			c.gids.put(gid, it.Work.ID)
		}
	}
	return out, nil
}

// ClaimStates reports each gid's catalog claim visibility — live | draft |
// hidden — omitting gids the registry has no work for.
//
// This is the ONE hop version of "is this entry publicly readable": it answers
// from the reverse lookup alone, without hydrating any work. Callers that only
// need the verdict (the archive importer's post-run draft sweep) should use
// this rather than GalgameBatch, whose absent-row signal means the same thing
// but costs a second round-trip per chunk to compute.
func (c *Client) ClaimStates(ctx context.Context, gids []int) (map[int]string, error) {
	out := make(map[int]string, len(gids))
	for start := 0; start < len(gids); start += catalogLookupBatchMax {
		end := min(start+catalogLookupBatchMax, len(gids))
		body := catalogLookupBatchRequest{Items: make([]catalogLookupPair, 0, end-start)}
		for _, gid := range gids[start:end] {
			if gid <= 0 {
				continue
			}
			body.Items = append(body.Items, catalogLookupPair{
				Source: catalogSiteGalgameWiki, ExternalID: strconv.Itoa(gid),
			})
		}
		if len(body.Items) == 0 {
			continue
		}
		raw, err := c.postV1(ctx, "/catalog/lookup/batch?nsfw=1", body)
		if err != nil {
			return nil, err
		}
		var data catalogLookupBatchData
		if err := json.Unmarshal(raw, &data); err != nil {
			return nil, fmt.Errorf("解析 catalog lookup batch data 失败: %w", err)
		}
		for i := range data.Items {
			it := &data.Items[i]
			gid, err := strconv.Atoi(it.ExternalID)
			if err != nil || it.Work == nil {
				continue
			}
			out[gid] = claimStateOf(it.ClaimedBy)
			c.gids.put(gid, it.Work.ID)
		}
	}
	return out, nil
}

// resolveGID maps a single wiki gid to its catalog work id. found=false means
// the registry has no work anchored to that gid.
func (c *Client) resolveGID(ctx context.Context, gid int) (catalogID int64, found bool, err error) {
	if gid <= 0 {
		return 0, false, nil
	}
	if id, ok := c.gids.get(gid); ok {
		return id, true, nil
	}
	q := url.Values{}
	q.Set("source", catalogSiteGalgameWiki)
	q.Set("external_id", strconv.Itoa(gid))
	q.Set("nsfw", "1")

	raw, status, err := c.getV1RawStatus(ctx, "/catalog/lookup", q)
	if err != nil {
		if status == http.StatusNotFound {
			return 0, false, nil
		}
		return 0, false, err
	}
	var data catalogLookupData
	if err := json.Unmarshal(raw, &data); err != nil {
		return 0, false, fmt.Errorf("解析 catalog lookup data 失败: %w", err)
	}
	if data.Work == nil {
		return 0, false, nil
	}
	c.gids.put(gid, data.Work.ID)
	return data.Work.ID, true, nil
}

// joinInt64s renders catalog ids for an `ids=` query value.
func joinInt64s(xs []int64) string {
	parts := make([]string, 0, len(xs))
	for _, x := range xs {
		parts = append(parts, strconv.FormatInt(x, 10))
	}
	return strings.Join(parts, ",")
}
