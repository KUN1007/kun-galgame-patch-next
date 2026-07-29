package client

// Taxonomy read reshapers (open-API phase 2 wave 07, W3). The generic Proxy
// forwards moyu's verbatim taxonomy reads; this file intercepts the A-bucket GET
// reads and serves them from the /v1 public contract, reshaping the curated
// records back to the bridge `data` the moyu handler + FE consume.
//
// The surviving set after the wave-A1 and wave-A2-2 dead-lane sweeps is exactly
// what the FE consumes: tag/official search + detail, engine list, series list.
// The B-bucket reads (tag/official/engine/series /:id/revisions) and every
// write are NOT handled here — they fall through to the internal / legacy face
// unchanged (see Proxy). The /v1 curation deliberately drops raw-model-only
// fields (taxonomy alias-row {id,created,updated}, engine created/updated) that
// the moyu FE does not consume (W3 census); those diffs are the expected
// route-B curation, not a regression.

import (
	"context"
	"encoding/json"
	"net/url"
	"strconv"
	"strings"
)

// proxyReadV1 classifies pathAndQuery as an A-bucket taxonomy/relation read and,
// when it is one, serves it from /v1 (returning the reshaped bridge `data` and
// handled=true). Returns handled=false to let Proxy fall through to the
// internal/legacy routing (B-bucket revisions, writes, anything unrecognized).
func (c *Client) proxyReadV1(ctx context.Context, pathAndQuery string) (data json.RawMessage, handled bool, err error) {
	path := pathAndQuery
	rawQuery := ""
	if i := strings.IndexByte(path, '?'); i >= 0 {
		rawQuery = path[i+1:]
		path = path[:i]
	}
	q, _ := url.ParseQuery(rawQuery)
	segs := strings.Split(strings.Trim(path, "/"), "/")
	if len(segs) == 0 || segs[0] == "" {
		return nil, false, nil
	}

	switch segs[0] {
	case "tag":
		switch {
		// The bare tag/official LIST reads were retired in wave A2-2 (no moyu
		// route fronts them any more). The arm stays as an explicit "not ours"
		// so segs[1] below is always in range.
		case len(segs) == 1:
			return nil, false, nil
		case segs[1] == "search":
			return c.wrap(c.v1TaxSearch(ctx, "/galgame/tags/search", q, "q", "category", "limit"))
		case len(segs) == 2:
			return c.wrap(c.v1EntityDetail(ctx, "tags", "tag", q.Get("tag_id"), q))
		}
	case "official":
		switch {
		case len(segs) == 1:
			return nil, false, nil
		case segs[1] == "search":
			return c.wrap(c.v1TaxSearch(ctx, "/galgame/officials/search", q, "q", "category", "lang", "limit"))
		case len(segs) == 2:
			return c.wrap(c.v1EntityDetail(ctx, "officials", "official", q.Get("official_id"), q))
		}
	case "engine":
		if len(segs) == 1 {
			return c.wrap(c.v1EngineList(ctx, q))
		}
	case "series":
		if len(segs) == 1 {
			return c.wrap(c.v1TaxList(ctx, "/galgame/series", q))
		}
	}
	return nil, false, nil
}

// wrap adapts a (data, err) reshaper result to the (data, handled, err) contract
// — every reshaper below OWNS its path, so handled is always true.
func (c *Client) wrap(data json.RawMessage, err error) (json.RawMessage, bool, error) {
	return data, true, err
}

// copyParams copies the named query params (when present) from src into a fresh
// url.Values for forwarding to /v1.
func copyParams(src url.Values, names ...string) url.Values {
	out := url.Values{}
	for _, n := range names {
		if v := src.Get(n); v != "" {
			out.Set(n, v)
		}
	}
	return out
}

// v1TaxList forwards a curated list read (series is the last member since wave
// A2-2) — the /v1 {items,total} envelope IS the shape moyu emits, so the data
// passes through.
func (c *Client) v1TaxList(ctx context.Context, path string, q url.Values) (json.RawMessage, error) {
	return c.getV1Raw(ctx, path, copyParams(q, "page", "limit", "content_limit"))
}

// v1TaxSearch forwards a curated Meili-backed search read (tags / officials). The
// /v1 {items,total,processing_time_ms} envelope passes through.
func (c *Client) v1TaxSearch(ctx context.Context, path string, q url.Values, params ...string) (json.RawMessage, error) {
	return c.getV1Raw(ctx, path, copyParams(q, params...))
}

// v1EntityDetail composes a tag/official detail from the by-id entity record
// (/v1/galgame/{kind}/{id}) + the reverse-lookup galgame page
// (/v1/galgame/{kind}/{id}/galgames), reshaping to the bridge
// {<entityKey>: entity, galgames: [...], total} the moyu TaxonomyDetailProxy
// enriches. entityKey is "tag" / "official". idStr comes from the tag_id /
// official_id query param (the :name path segment is cosmetic).
func (c *Client) v1EntityDetail(ctx context.Context, kind, entityKey, idStr string, q url.Values) (json.RawMessage, error) {
	if idStr == "" {
		idStr = "0" // mirror the bridge: a missing/0 id resolves to 404
	}
	entity, err := c.getV1Raw(ctx, "/galgame/"+kind+"/"+idStr, nil)
	if err != nil {
		return nil, err
	}
	rev, err := c.getV1Raw(ctx, "/galgame/"+kind+"/"+idStr+"/galgames",
		copyParams(q, "page", "limit", "content_limit", "sort_field", "sort_order"))
	if err != nil {
		return nil, err
	}
	var revData struct {
		Galgames json.RawMessage `json:"galgames"`
		Total    int64           `json:"total"`
	}
	if err := json.Unmarshal(rev, &revData); err != nil {
		return nil, err
	}
	galgames := revData.Galgames
	if len(galgames) == 0 {
		galgames = json.RawMessage("[]")
	}
	return json.Marshal(map[string]any{
		entityKey:  entity,
		"galgames": galgames,
		"total":    revData.Total,
	})
}

// v1EngineList reconstructs the bridge bare-array engine list (ListAll, cnt DESC)
// by paginating the /v1 engines list (page/limit, capped at 100) and
// concatenating the curated records into a bare array — the shape the moyu FE
// engineList reader expects (data itself is the array).
func (c *Client) v1EngineList(ctx context.Context, q url.Values) (json.RawMessage, error) {
	const pageSize = 100
	items := []json.RawMessage{}
	for page := 1; ; page++ {
		fq := url.Values{}
		fq.Set("page", strconv.Itoa(page))
		fq.Set("limit", strconv.Itoa(pageSize))
		data, err := c.getV1Raw(ctx, "/galgame/engines", fq)
		if err != nil {
			return nil, err
		}
		var env struct {
			Items []json.RawMessage `json:"items"`
		}
		if err := json.Unmarshal(data, &env); err != nil {
			return nil, err
		}
		items = append(items, env.Items...)
		if len(env.Items) < pageSize {
			break
		}
	}
	return json.Marshal(items)
}

// NOTE (wave A1): the engine `:id` detail, series `search` and series `:id`
// detail reshapers, plus the galgame links/aliases edit-prefill reshapers, were
// deleted here together with the moyu routes that fronted them — a consumption
// census found no frontend caller for any of the five. Their /v1 sources
// (/galgame/engines/{id}, /galgame/series/{id}, the detail's links/aliases
// blocks) are untouched and still available should a consumer ever appear.
//
// NOTE (wave A2-2): the tag LIST, official LIST and `tag/multi` reshapers went
// the same way — a second census (this time over the whole of apps/web, not just
// the composable) found that useGalgameEdit exposes no tagList / officialList /
// tagMulti at all, so nothing could ever have called them. `/galgame/tags/multi`
// is worth a footnote: it is the only DAG consumer moyu ever had, and the
// canonical catalog vocabulary has no DAG (refs/proj/126 P2 accepts the
// descendant expansion degrading to a flat multi-tag AND) — retiring an
// uncalled lane spends none of that budget.
