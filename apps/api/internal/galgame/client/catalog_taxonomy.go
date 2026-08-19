package client

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"strconv"
	"strings"
)

func (c *Client) TaxonomyBrowse(ctx context.Context, pathAndQuery string) (data json.RawMessage, handled bool, err error) {
	path, rawQuery := splitPathQuery(pathAndQuery)
	q, _ := url.ParseQuery(rawQuery)
	segs := strings.Split(strings.Trim(path, "/"), "/")
	if len(segs) == 0 || segs[0] == "" {
		return nil, false, nil
	}

	if len(segs) == 2 && segs[1] != "search" {
		switch segs[0] {
		case "tag":
			d, e := c.catalogTagDetail(ctx, q.Get("tag_id"), q)
			return d, true, e
		case "official":
			d, e := c.catalogLabelDetail(ctx, q.Get("official_id"), q)
			return d, true, e
		}
	}
	return nil, false, nil
}

func splitPathQuery(pathAndQuery string) (path, rawQuery string) {
	if i := strings.IndexByte(pathAndQuery, '?'); i >= 0 {
		return pathAndQuery[:i], pathAndQuery[i+1:]
	}
	return pathAndQuery, ""
}

func taxonomyPageWindow(q url.Values) (page, limit int) {
	limit = atoiDefault(q.Get("limit"), 24)
	if limit <= 0 || limit > 50 {
		limit = 24
	}
	page = atoiDefault(q.Get("page"), 1)
	if page < 1 {
		page = 1
	}
	return page, limit
}

func atoiDefault(s string, def int) int {
	if n, err := strconv.Atoi(strings.TrimSpace(s)); err == nil {
		return n
	}
	return def
}

type catalogTagBrief struct {
	ID           int64    `json:"id"`
	Name         string   `json:"name"`
	Aliases      []string `json:"aliases"`
	Category     string   `json:"category"`
	Sexual       bool     `json:"sexual"`
	Description  string   `json:"description"`
	GalgameCount int      `json:"galgame_count"`
	Tier         string   `json:"tier"`
	Kind         string   `json:"kind"`
}

type catalogOfficialBrief struct {
	ID           int64    `json:"id"`
	Name         string   `json:"name"`
	Aliases      []string `json:"aliases"`
	Category     string   `json:"category"`
	Lang         string   `json:"lang"`
	Link         string   `json:"link"`
	Description  string   `json:"description"`
	GalgameCount int      `json:"galgame_count"`
	LogoHash     string   `json:"logo_hash"`
}

type catalogIntroRow struct {
	Lang   string `json:"lang"`
	Intro  string `json:"intro"`
	Source string `json:"source"`
}

type catalogTagRecord struct {
	ID        int64             `json:"id"`
	Name      string            `json:"name"`
	Tier      string            `json:"tier"`
	Kind      string            `json:"kind"`
	Sexual    bool              `json:"sexual"`
	WorkCount int               `json:"work_count"`
	Intros    []catalogIntroRow `json:"intros"`
}

type catalogLabelLink struct {
	Source string `json:"source"`
	URL    string `json:"url"`
}

// Catalog wave 209 turned aliases[] from []string into these rows. Decoding
// them into the old []string failed the whole request, so every label that had
// an alias answered 50000 "调用 Galgame 资料库失败" — 35 of 60 sampled ids.
// The fake in catalog_fake_test.go still served flat strings, so the suite
// stayed green through it.
type catalogAlias struct {
	Value   string `json:"value"`
	Lang    string `json:"lang"`
	Kind    string `json:"kind"`
	Machine bool   `json:"machine"`
}

type catalogLabelRecord struct {
	ID          int64              `json:"id"`
	DisplayName string             `json:"display_name"`
	Kind        string             `json:"kind"`
	Lang        string             `json:"lang"`
	Aliases     []catalogAlias     `json:"aliases"`
	WorkCount   int                `json:"work_count"`
	Intros      []catalogIntroRow  `json:"intros"`
	Links       []catalogLabelLink `json:"links"`
	LogoHash    string             `json:"logo_hash"`
}

func aliasValues(rows []catalogAlias) []string {
	out := make([]string, 0, len(rows))
	for _, r := range rows {
		if r.Value != "" {
			out = append(out, r.Value)
		}
	}
	return out
}

func preferredIntro(rows []catalogIntroRow) string {
	order := []string{"zh-cn", "ja-jp", "en-us"}
	byKey := make(map[string]string, len(rows))
	for _, r := range rows {
		k := productLangFromCatalog(r.Lang)
		if _, taken := byKey[k]; !taken {
			byKey[k] = r.Intro
		}
	}
	for _, k := range order {
		if v := byKey[k]; v != "" {
			return v
		}
	}
	for _, r := range rows {
		if r.Intro != "" {
			return r.Intro
		}
	}
	return ""
}

func (c *Client) catalogTagDetail(ctx context.Context, idStr string, q url.Values) (json.RawMessage, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(idStr), 10, 64)
	if err != nil || id <= 0 {
		return nil, &GalgameError{Code: galgameCodeNotFound, Message: "tag not found"}
	}
	gate := gateFor(q.Get("content_limit"))

	fq := url.Values{}
	applyNSFW(fq)

	var rec catalogTagRecord
	if err := c.getV1(ctx, fmt.Sprintf("/catalog/tags/%d", id), fq, &rec); err != nil {
		return nil, err
	}
	members, total, err := c.taxonomyMembers(ctx, "tag_id", id, q, gate)
	if err != nil {
		return nil, err
	}
	return json.Marshal(map[string]any{
		"tag": catalogTagBrief{
			ID:           rec.ID,
			Name:         rec.Name,
			Aliases:      []string{},
			Category:     tagCategoryFor(rec.Sexual),
			Sexual:       rec.Sexual,
			Description:  preferredIntro(rec.Intros),
			GalgameCount: int(total),
			Tier:         rec.Tier,
			Kind:         rec.Kind,
		},
		"galgames": members,
		"total":    total,
	})
}

func (c *Client) catalogLabelDetail(ctx context.Context, idStr string, q url.Values) (json.RawMessage, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(idStr), 10, 64)
	if err != nil || id <= 0 {
		return nil, &GalgameError{Code: galgameCodeNotFound, Message: "official not found"}
	}
	gate := gateFor(q.Get("content_limit"))

	fq := url.Values{}
	applyNSFW(fq)

	var rec catalogLabelRecord
	if err := c.getV1(ctx, fmt.Sprintf("/catalog/labels/%d", id), fq, &rec); err != nil {
		return nil, err
	}
	members, total, err := c.taxonomyMembers(ctx, "label_id", id, q, gate)
	if err != nil {
		return nil, err
	}
	link := ""
	if len(rec.Links) > 0 {
		link = rec.Links[0].URL
	}
	return json.Marshal(map[string]any{
		"official": catalogOfficialBrief{
			ID:           rec.ID,
			Name:         rec.DisplayName,
			Aliases:      aliasValues(rec.Aliases),
			Category:     rec.Kind,
			Lang:         productLangFromCatalog(rec.Lang),
			Link:         link,
			Description:  preferredIntro(rec.Intros),
			LogoHash:     rec.LogoHash,
			GalgameCount: int(total),
		},
		"galgames": members,
		"total":    total,
	})
}

const taxonomyMemberSort = "released_desc"

func (c *Client) taxonomyMembers(ctx context.Context, filterKey string, id int64, q url.Values, gate catalogGate) ([]GalgameBrief, int64, error) {
	page, limit := taxonomyPageWindow(q)

	fq := url.Values{}
	fq.Set(filterKey, strconv.FormatInt(id, 10))
	fq.Set("claim_state", "live")
	fq.Set("include", "names,covers,refs")
	fq.Set("sort", taxonomyMemberSort)
	fq.Set("page", strconv.Itoa(page))
	fq.Set("limit", strconv.Itoa(limit))
	gate.apply(fq)

	var data catalogWorksSearchData
	if err := c.getV1(ctx, "/catalog/works/search", fq, &data); err != nil {
		return nil, 0, err
	}
	out := make([]GalgameBrief, 0, len(data.Items))
	for i := range data.Items {
		out = append(out, catalogItemToBrief(&data.Items[i]))
	}
	return out, data.Total, nil
}
