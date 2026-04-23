// Package client 封装 Galgame Wiki Service 的 HTTP 调用。
//
// 背景（D8 / D11）：本项目（patch 站）不再在本地落库 galgame / tag / official 等元数据，
// 统一通过 vndb_id 调用 Wiki Service 获取。Wiki 的搜索基于 Meilisearch，
// 支持 CJK 分词、typo 容错、facet 聚合，远比本项目内的 ILIKE 或本地索引好用。
//
// 参考：docs/galgame_wiki/api-reference.md
package client

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// Client 调 Wiki Service 的薄封装。
type Client struct {
	baseURL string
	http    *http.Client
}

// New 构造 Client。baseURL 形如 http://127.0.0.1:9280/api
func New(baseURL string) *Client {
	return &Client{
		baseURL: strings.TrimRight(baseURL, "/"),
		http:    &http.Client{Timeout: 10 * time.Second},
	}
}

// wikiResponse 是 Wiki 所有 JSON 响应的统一外壳。
type wikiResponse[T any] struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    T      `json:"data"`
}

// Paginated 是 Wiki 分页响应里 data 字段的形状。
type Paginated[T any] struct {
	Items []T   `json:"items"`
	Total int64 `json:"total"`
}

// ─── 模型（只保留本项目用得到的字段） ──────────────────

// GalgameHit 是 Wiki /galgame/search 返回的单项。
type GalgameHit struct {
	ID               int    `json:"id"`
	VndbID           string `json:"vndb_id"`
	NameEnUs         string `json:"name_en_us"`
	NameZhCn         string `json:"name_zh_cn"`
	NameJaJp         string `json:"name_ja_jp"`
	NameZhTw         string `json:"name_zh_tw"`
	Banner           string `json:"banner"`
	ContentLimit     string `json:"content_limit"`
	AgeLimit         string `json:"age_limit"`
	OriginalLanguage string `json:"original_language"`
	Released         string `json:"released"`
	View             int    `json:"view"`
	Status           int    `json:"status"`
	TagIDs           []int  `json:"tag_ids"`
	OfficialIDs      []int  `json:"official_ids"`
	EngineIDs        []int  `json:"engine_ids"`
}

// GalgameBrief 是 /galgame/batch 返回的轻量形状。
type GalgameBrief struct {
	ID                 int    `json:"id"`
	VndbID             string `json:"vndb_id"`
	NameEnUs           string `json:"name_en_us"`
	NameZhCn           string `json:"name_zh_cn"`
	NameJaJp           string `json:"name_ja_jp"`
	NameZhTw           string `json:"name_zh_tw"`
	Banner             string `json:"banner"`
	ContentLimit       string `json:"content_limit"`
	AgeLimit           string `json:"age_limit"`
	OriginalLanguage   string `json:"original_language"`
	UserID             int    `json:"user_id"`
	ResourceUpdateTime string `json:"resource_update_time"`
}

// Tag 是 Wiki 的 galgame_tag。
type Tag struct {
	ID            int      `json:"id"`
	Name          string   `json:"name"`
	Aliases       []string `json:"aliases"`
	Category      string   `json:"category"`
	GalgameCount  int      `json:"galgame_count"`
}

// Official 是 Wiki 的 galgame_official（开发商/发行商）。
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

// ─── 通用 GET ────────────────────────────────────────

// get 发起 GET，解析 {code, message, data} 外壳并把 data 反序列化到 out。
func (c *Client) get(ctx context.Context, path string, query url.Values, out any) error {
	u := c.baseURL + path
	if len(query) > 0 {
		u += "?" + query.Encode()
	}

	req, err := http.NewRequestWithContext(ctx, "GET", u, nil)
	if err != nil {
		return fmt.Errorf("构造请求失败: %w", err)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("调用 Wiki 失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("读取 Wiki 响应失败: %w", err)
	}

	var wrapper wikiResponse[json.RawMessage]
	if err := json.Unmarshal(body, &wrapper); err != nil {
		return fmt.Errorf("解析 Wiki 响应失败: %w (body=%s)", err, truncate(string(body), 200))
	}
	if wrapper.Code != 0 {
		return fmt.Errorf("Wiki 业务错误 code=%d: %s", wrapper.Code, wrapper.Message)
	}
	if out == nil {
		return nil
	}
	if err := json.Unmarshal(wrapper.Data, out); err != nil {
		return fmt.Errorf("解析 Wiki data 失败: %w", err)
	}
	return nil
}

// ─── 高阶方法 ────────────────────────────────────────

// SearchGalgameParams 是 /galgame/search 的查询参数。
type SearchGalgameParams struct {
	Q               string
	ContentLimit    string // sfw / nsfw
	AgeLimit        string // all / r18
	OriginalLang    string // csv，例如 "ja-jp,en-us"
	TagIDs          []int
	OfficialIDs     []int
	EngineIDs       []int
	SeriesID        int
	ReleasedFrom    int
	ReleasedTo      int
	IncludeIntro    bool
	Sort            string // relevance / released_desc / released_asc / view / updated
	Page            int
	Limit           int
}

// SearchGalgame 调 /galgame/search。
func (c *Client) SearchGalgame(ctx context.Context, p SearchGalgameParams) (*Paginated[GalgameHit], error) {
	q := url.Values{}
	if p.Q != "" {
		q.Set("q", p.Q)
	}
	if p.ContentLimit != "" {
		q.Set("content_limit", p.ContentLimit)
	}
	if p.AgeLimit != "" {
		q.Set("age_limit", p.AgeLimit)
	}
	if p.OriginalLang != "" {
		q.Set("original_language", p.OriginalLang)
	}
	if len(p.TagIDs) > 0 {
		q.Set("tag_ids", joinInts(p.TagIDs))
	}
	if len(p.OfficialIDs) > 0 {
		q.Set("official_ids", joinInts(p.OfficialIDs))
	}
	if len(p.EngineIDs) > 0 {
		q.Set("engine_ids", joinInts(p.EngineIDs))
	}
	if p.SeriesID > 0 {
		q.Set("series_id", strconv.Itoa(p.SeriesID))
	}
	if p.ReleasedFrom > 0 {
		q.Set("released_from", strconv.Itoa(p.ReleasedFrom))
	}
	if p.ReleasedTo > 0 {
		q.Set("released_to", strconv.Itoa(p.ReleasedTo))
	}
	if p.IncludeIntro {
		q.Set("include_intro", "true")
	}
	if p.Sort != "" {
		q.Set("sort", p.Sort)
	}
	if p.Page > 0 {
		q.Set("page", strconv.Itoa(p.Page))
	}
	if p.Limit > 0 {
		q.Set("limit", strconv.Itoa(p.Limit))
	}
	q.Set("facets", "false")
	q.Set("highlight", "false")

	var out Paginated[GalgameHit]
	if err := c.get(ctx, "/galgame/search", q, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// CheckGalgameByVndbID 调 /galgame/check?vndb_id=xxx，返回 (exists, galgame_id)。
// 用于 POST /api/patch 前置校验。
func (c *Client) CheckGalgameByVndbID(ctx context.Context, vndbID string) (exists bool, galgameID int, err error) {
	q := url.Values{}
	q.Set("vndb_id", vndbID)

	var out struct {
		Exists    bool `json:"exists"`
		GalgameID int  `json:"galgame_id"`
	}
	if err := c.get(ctx, "/galgame/check", q, &out); err != nil {
		return false, 0, err
	}
	return out.Exists, out.GalgameID, nil
}

// GalgameBatch 调 /galgame/batch?ids=1,2,3，批量取轻量 galgame 信息。
func (c *Client) GalgameBatch(ctx context.Context, ids []int) ([]GalgameBrief, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	q := url.Values{}
	q.Set("ids", joinInts(ids))

	var out []GalgameBrief
	if err := c.get(ctx, "/galgame/batch", q, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// TagSearchResult 是 /tag/search 的响应（注意：它不套在 Paginated 里，total 在外层）。
type TagSearchResult struct {
	Items            []Tag `json:"items"`
	Total            int64 `json:"total"`
	ProcessingTimeMs int64 `json:"processing_time_ms"`
}

// SearchTag 调 /tag/search。
func (c *Client) SearchTag(ctx context.Context, q, category string, limit int) (*TagSearchResult, error) {
	params := url.Values{}
	if q != "" {
		params.Set("q", q)
	}
	if category != "" {
		params.Set("category", category)
	}
	if limit > 0 {
		params.Set("limit", strconv.Itoa(limit))
	}
	var out TagSearchResult
	if err := c.get(ctx, "/tag/search", params, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// OfficialSearchResult 是 /official/search 的响应。
type OfficialSearchResult struct {
	Items            []Official `json:"items"`
	Total            int64      `json:"total"`
	ProcessingTimeMs int64      `json:"processing_time_ms"`
}

// SearchOfficial 调 /official/search。
func (c *Client) SearchOfficial(ctx context.Context, q, category, lang string, limit int) (*OfficialSearchResult, error) {
	params := url.Values{}
	if q != "" {
		params.Set("q", q)
	}
	if category != "" {
		params.Set("category", category)
	}
	if lang != "" {
		params.Set("lang", lang)
	}
	if limit > 0 {
		params.Set("limit", strconv.Itoa(limit))
	}
	var out OfficialSearchResult
	if err := c.get(ctx, "/official/search", params, &out); err != nil {
		return nil, err
	}
	return &out, nil
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
