package client

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"
)

const catalogCodeNotFound = 4

const catalogCodeMoved = 12

func catalogAbsent(status int, err error) bool {
	if status != http.StatusNotFound {
		return false
	}
	var gerr *GalgameError
	return errors.As(err, &gerr) && gerr.Code == catalogCodeNotFound
}

const catalogLookupBatchMax = 100

var anchorSourceKeys = []string{"curated", "galgame_wiki"}

func gidLookupStride() int {
	return max(catalogLookupBatchMax/len(anchorSourceKeys), 1)
}

const CatalogWorksIDsMax = 100

const gidMapTTL = time.Hour

const gidMapMaxEntries = 20000

type gidMapEntry struct {
	catalogID int64
	at        time.Time
}

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
	if len(g.m) >= gidMapMaxEntries {
		g.m = make(map[int]gidMapEntry, gidMapMaxEntries/4)
	}
	g.m[gid] = gidMapEntry{catalogID: catalogID, at: time.Now()}
}

type catalogGate struct {
	contentLimit  string
	contentRating string
}

func gateFor(contentLimit string) catalogGate {
	switch strings.ToLower(strings.TrimSpace(contentLimit)) {
	case "sfw":
		return catalogGate{contentLimit: "sfw"}
	case "nsfw":
		return catalogGate{contentLimit: "nsfw"}
	default:
		return catalogGate{}
	}
}

func (g catalogGate) apply(q url.Values) {
	applyNSFW(q)
	if g.contentLimit != "" {
		q.Set("content_limit", g.contentLimit)
	}
	if g.contentRating != "" {
		q.Set("content_rating", g.contentRating)
	}
}

func (g catalogGate) allows(displayLimit string) bool {
	return g.contentLimit == "" || g.contentLimit == displayLimit
}

func applyNSFW(q url.Values) { q.Set("nsfw", "1") }

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
		return nil, upstreamError(resp, env.Code, env.Message)
	}
	return env.Data, nil
}

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
	stride := gidLookupStride()
	for start := 0; start < len(missing); start += stride {
		end := min(start+stride, len(missing))
		chunk := missing[start:end]

		body := catalogLookupBatchRequest{
			Items: make([]catalogLookupPair, 0, len(chunk)*len(anchorSourceKeys)),
		}
		for _, gid := range chunk {
			for _, source := range anchorSourceKeys {
				body.Items = append(body.Items, catalogLookupPair{
					Source: source, ExternalID: strconv.Itoa(gid),
				})
			}
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
	var unbridged []int
	for _, gid := range missing {
		if _, ok := out[gid]; !ok {
			unbridged = append(unbridged, gid)
		}
	}
	if len(unbridged) > 0 {
		adopted, err := c.resolveByIdentity(ctx, unbridged)
		if err != nil {
			return nil, err
		}
		for gid, id := range adopted {
			out[gid] = id
		}
	}
	return out, nil
}

func (c *Client) resolveByIdentity(ctx context.Context, gids []int) (map[int]int64, error) {
	out := make(map[int]int64, len(gids))
	for start := 0; start < len(gids); start += CatalogWorksIDsMax {
		end := min(start+CatalogWorksIDsMax, len(gids))
		ids := make([]int64, 0, end-start)
		for _, gid := range gids[start:end] {
			ids = append(ids, int64(gid))
		}
		q := url.Values{}
		q.Set("ids", joinInt64s(ids))
		q.Set("limit", strconv.Itoa(CatalogWorksIDsMax))
		applyNSFW(q)

		raw, status, err := c.getV1RawStatus(ctx, "/catalog/works", q)
		if err != nil {
			if catalogAbsent(status, err) {
				continue
			}
			return nil, err
		}
		var data catalogWorksListData
		if err := json.Unmarshal(raw, &data); err != nil {
			return nil, fmt.Errorf("解析 catalog works data 失败: %w", err)
		}
		for i := range data.Items {
			it := &data.Items[i]
			gid := it.ClaimedBy.gid()
			if gid == 0 || int64(gid) != it.ID {
				continue
			}
			out[gid] = it.ID
			c.gids.put(gid, it.ID)
		}
	}
	return out, nil
}

func (c *Client) ClaimStates(ctx context.Context, gids []int) (map[int]string, error) {
	out := make(map[int]string, len(gids))
	stride := gidLookupStride()
	for start := 0; start < len(gids); start += stride {
		end := min(start+stride, len(gids))
		body := catalogLookupBatchRequest{
			Items: make([]catalogLookupPair, 0, (end-start)*len(anchorSourceKeys)),
		}
		for _, gid := range gids[start:end] {
			if gid <= 0 {
				continue
			}
			for _, source := range anchorSourceKeys {
				body.Items = append(body.Items, catalogLookupPair{
					Source: source, ExternalID: strconv.Itoa(gid),
				})
			}
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

func (c *Client) resolveGID(ctx context.Context, gid int) (catalogID int64, found bool, err error) {
	if gid <= 0 {
		return 0, false, nil
	}
	if id, ok := c.gids.get(gid); ok {
		return id, true, nil
	}
	for _, source := range anchorSourceKeys {
		id, found, err := c.resolveGIDBySource(ctx, source, gid)
		if err != nil || found {
			return id, found, err
		}
	}
	adopted, err := c.resolveByIdentity(ctx, []int{gid})
	if err != nil {
		return 0, false, err
	}
	if id, ok := adopted[gid]; ok {
		return id, true, nil
	}
	return 0, false, nil
}

func (c *Client) ResolveWorkID(ctx context.Context, gid int) (int64, bool, error) {
	return c.resolveGID(ctx, gid)
}

func (c *Client) resolveGIDBySource(ctx context.Context, source string, gid int) (int64, bool, error) {
	q := url.Values{}
	q.Set("source", source)
	q.Set("external_id", strconv.Itoa(gid))
	q.Set("nsfw", "1")

	raw, status, err := c.getV1RawStatus(ctx, "/catalog/lookup", q)
	if err != nil {
		if catalogAbsent(status, err) {
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

func (c *Client) ResolveWikiLabel(ctx context.Context, oid int) (int64, bool, error) {
	if oid <= 0 {
		return 0, false, nil
	}
	for _, source := range anchorSourceKeys {
		id, found, err := c.resolveWikiLabelBySource(ctx, source, oid)
		if err != nil || found {
			return id, found, err
		}
	}
	return 0, false, nil
}

func (c *Client) resolveWikiLabelBySource(ctx context.Context, source string, oid int) (int64, bool, error) {
	q := url.Values{}
	q.Set("type", "label")
	q.Set("source", source)
	q.Set("external_id", strconv.Itoa(oid))
	q.Set("nsfw", "1")

	raw, status, err := c.getV1RawStatus(ctx, "/catalog/lookup", q)
	if err != nil {
		if catalogAbsent(status, err) {
			return 0, false, nil
		}
		return 0, false, err
	}
	var data struct {
		Label *struct {
			ID int64 `json:"id"`
		} `json:"label"`
	}
	if err := json.Unmarshal(raw, &data); err != nil {
		return 0, false, fmt.Errorf("解析 catalog label lookup data 失败: %w", err)
	}
	if data.Label == nil {
		return 0, false, nil
	}
	return data.Label.ID, true, nil
}

func joinInt64s(xs []int64) string {
	parts := make([]string, 0, len(xs))
	for _, x := range xs {
		parts = append(parts, strconv.FormatInt(x, 10))
	}
	return strings.Join(parts, ",")
}
