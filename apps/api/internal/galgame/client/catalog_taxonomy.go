package client

// Taxonomy reads after the wave-A2-2 re-anchor.
//
// The taxonomy reads split into TWO lanes with two different id spaces, and
// keeping them apart is the whole design (refs/proj/106 R11):
//
//	STAFF lane  — the admin console's picker + edit form. Its ids feed straight
//	              back into PUT /tag {tag_id} / DELETE /tag/:id on the wiki staff
//	              write face, so they MUST be wiki taxonomy PKs. These reads
//	              therefore go to the surviving `/api` staff face, which grew a
//	              read-back pair per family in A2-1e precisely so a console can
//	              read what it is about to overwrite. (Before that pair existed
//	              the console prefilled from list rows and silently WIPED every
//	              field the list did not carry — aliases on all four families,
//	              plus tag/official descriptions.)
//
//	BROWSE lane — the two public pages, /tag/:id and /official/:id. These move to
//	              the CATALOG id space (P2 / R1): catalog_tag ids and
//	              catalog_label ids, with the old wiki-keyed URLs reduced to
//	              redirect shells.
//
// Nothing in this file touches the deprecated /v1/galgame face — that is the
// point of the wave.

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"strconv"
	"strings"
)

// staffTaxonomyKinds are the four families the `/api` staff read-back covers.
var staffTaxonomyKinds = map[string]struct{}{
	"tag": {}, "official": {}, "engine": {}, "series": {},
}

// staffReadPath maps a moyu taxonomy read path onto its `/api` staff
// counterpart, or returns ok=false when the path is not a staff read.
//
// Three of the four are already path-identical; the engine and series LIST
// reads are rewritten to the staff face's `search` form, which is what the
// console's "list everything, filter by keyword" pane actually wants — and
// which, unlike the old bare list, is bounded.
func staffReadPath(path string) (string, bool) {
	segs := strings.Split(strings.Trim(path, "/"), "/")
	if len(segs) == 0 {
		return "", false
	}
	if _, ok := staffTaxonomyKinds[segs[0]]; !ok {
		return "", false
	}
	switch {
	case len(segs) == 1:
		// Only engine and series keep a bare-list moyu route; the tag and
		// official bare lists were retired earlier in this wave as FE-dead, and
		// resurrecting them here through the back door would undo that.
		if segs[0] != "engine" && segs[0] != "series" {
			return "", false
		}
		return "/" + segs[0] + "/search", true
	case len(segs) == 2 && segs[1] == "search":
		return path, true
	}
	return "", false
}

// staffDetailPath maps moyu's `/taxonomy/{kind}/{id}` read-back route onto the
// `/api/{kind}/{id}` staff record. This route exists on its own prefix because
// `/tag/{id}` is already taken by the public browse page — and the two must not
// share a path, since they answer in two different id spaces.
func staffDetailPath(path string) (string, bool) {
	segs := strings.Split(strings.Trim(path, "/"), "/")
	if len(segs) != 3 || segs[0] != "taxonomy" {
		return "", false
	}
	if _, ok := staffTaxonomyKinds[segs[1]]; !ok {
		return "", false
	}
	if _, err := strconv.Atoi(segs[2]); err != nil {
		return "", false
	}
	return "/" + segs[1] + "/" + segs[2], true
}

// proxyReadV1 classifies a proxied GET and serves it from the face that now
// owns it. handled=false lets Proxy fall through to its own face selection
// (the taxonomy revision reads, and every write).
func (c *Client) proxyReadV1(ctx context.Context, pathAndQuery string) (data json.RawMessage, handled bool, err error) {
	path, rawQuery := splitPathQuery(pathAndQuery)
	q, _ := url.ParseQuery(rawQuery)
	segs := strings.Split(strings.Trim(path, "/"), "/")
	if len(segs) == 0 || segs[0] == "" {
		return nil, false, nil
	}

	// The public browse pages: composed from the catalog.
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

// splitPathQuery splits "/a/b?x=1" into its path and raw query.
func splitPathQuery(pathAndQuery string) (path, rawQuery string) {
	if i := strings.IndexByte(pathAndQuery, '?'); i >= 0 {
		return pathAndQuery[:i], pathAndQuery[i+1:]
	}
	return pathAndQuery, ""
}

// ─── the catalog-backed browse lane ───────────────────────────────────────

// taxonomyPageWindow turns moyu's page/limit into the catalog's limit/offset.
// The catalog's entity detail paginates its member list by offset (unlike the
// works browse lane, which is keyset) — which is exactly what these pages need,
// because their pagination is crawlable `?page=N` links.
func taxonomyPageWindow(q url.Values) (limit, offset int) {
	limit = atoiDefault(q.Get("limit"), 24)
	if limit <= 0 || limit > 50 {
		limit = 24
	}
	page := atoiDefault(q.Get("page"), 1)
	if page < 1 {
		page = 1
	}
	return limit, (page - 1) * limit
}

func atoiDefault(s string, def int) int {
	if n, err := strconv.Atoi(strings.TrimSpace(s)); err == nil {
		return n
	}
	return def
}

// catalogTagBrief is the entity block moyu emits for a tag page.
//
// `aliases` is always empty: the canonical tag vocabulary has no alias table
// (the wiki's 8,700 tag aliases were deliberately not migrated, P2). The key
// stays on the wire so the loss is visible rather than inferred from a missing
// key.
//
// `sexual` is the safety axis (A2-1f). The wiki's content|sexual|technical
// category had no successor for one wave — tier/kind are a different coordinate
// system and the flag then lived only on the work-tag edge — which is why this
// page had to fall back to a blanket noindex. The tag RECORD now carries it, so
// the SEO gate is precise again. `category` is derived from it for the same
// reason the work detail derives it: consumers keyed on the literal "sexual".
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

// catalogOfficialBrief is the entity block moyu emits for a label page.
type catalogOfficialBrief struct {
	ID           int64    `json:"id"`
	Name         string   `json:"name"`
	Aliases      []string `json:"aliases"`
	Category     string   `json:"category"`
	Lang         string   `json:"lang"`
	Link         string   `json:"link"`
	Description  string   `json:"description"`
	GalgameCount int      `json:"galgame_count"`
}

// catalog wire shapes for the two entity records.
type catalogIntroRow struct {
	Lang   string `json:"lang"`
	Intro  string `json:"intro"`
	Source string `json:"source"`
}

type catalogTagRecord struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Tier string `json:"tier"`
	Kind string `json:"kind"`
	// Sexual is the tag-level safety flag (A2-1f). Coverage caveat, stated
	// because a consumer must not read the default as an assertion: it is
	// derived from the wiki tag bridge's category, so an unmapped folksonomy tag
	// reads false — meaning "this source has no such axis", NOT "confirmed safe".
	Sexual     bool              `json:"sexual"`
	WorkCount  int               `json:"work_count"`
	Intros     []catalogIntroRow `json:"intros"`
	Works      []catalogWorkRef  `json:"works"`
	NextOffset *int              `json:"next_offset"`
}

type catalogWorkRef struct {
	ID        int64             `json:"id"`
	ClaimedBy *catalogClaimedBy `json:"claimed_by"`
}

type catalogLabelLink struct {
	Source string `json:"source"`
	URL    string `json:"url"`
}

type catalogLabelWorkRow struct {
	Work catalogWorkRef `json:"work"`
	Kind string         `json:"kind"`
}

type catalogLabelRecord struct {
	ID          int64                 `json:"id"`
	DisplayName string                `json:"display_name"`
	Kind        string                `json:"kind"`
	Lang        string                `json:"lang"`
	Aliases     []string              `json:"aliases"`
	WorkCount   int                   `json:"work_count"`
	Intros      []catalogIntroRow     `json:"intros"`
	Links       []catalogLabelLink    `json:"links"`
	Works       []catalogLabelWorkRow `json:"works"`
	NextOffset  *int                  `json:"next_offset"`
}

// preferredIntro picks the description to render: Chinese first, then Japanese,
// then English, then whatever exists. moyu is a Chinese-language site, and the
// catalog merges each language to its own winning source, so this is a display
// preference and not a quality judgement.
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

// catalogTagDetail composes the tag page: the canonical tag record plus one
// offset-paginated page of its works, hydrated to the brief the moyu handler
// enriches into cards.
func (c *Client) catalogTagDetail(ctx context.Context, idStr string, q url.Values) (json.RawMessage, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(idStr), 10, 64)
	if err != nil || id <= 0 {
		return nil, &GalgameError{Code: galgameCodeNotFound, Message: "tag not found"}
	}
	limit, offset := taxonomyPageWindow(q)

	fq := url.Values{}
	fq.Set("include", "works")
	fq.Set("limit", strconv.Itoa(limit))
	fq.Set("offset", strconv.Itoa(offset))
	gate := gateFor(q.Get("content_limit"))
	gate.apply(fq)

	var rec catalogTagRecord
	if err := c.getV1(ctx, fmt.Sprintf("/catalog/tags/%d", id), fq, &rec); err != nil {
		return nil, err
	}
	refs := make([]catalogWorkRef, len(rec.Works))
	copy(refs, rec.Works)
	briefs, err := c.hydrateWorkRefs(ctx, refs, gate)
	if err != nil {
		return nil, err
	}
	return json.Marshal(map[string]any{
		"tag": catalogTagBrief{
			ID:      rec.ID,
			Name:    rec.Name,
			Aliases: []string{},
			// Same derivation as the work detail's tags[]: a sexual-flagged tag
			// reads "sexual", everything else "content". Keeps every consumer
			// that keys on the literal string working off one boolean.
			Category:     tagCategoryFor(rec.Sexual),
			Sexual:       rec.Sexual,
			Description:  preferredIntro(rec.Intros),
			GalgameCount: rec.WorkCount,
			Tier:         rec.Tier,
			Kind:         rec.Kind,
		},
		"galgames": briefs,
		"total":    rec.WorkCount,
	})
}

// catalogLabelDetail composes the official ("label") page the same way.
func (c *Client) catalogLabelDetail(ctx context.Context, idStr string, q url.Values) (json.RawMessage, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(idStr), 10, 64)
	if err != nil || id <= 0 {
		return nil, &GalgameError{Code: galgameCodeNotFound, Message: "official not found"}
	}
	limit, offset := taxonomyPageWindow(q)

	fq := url.Values{}
	fq.Set("include", "works")
	fq.Set("limit", strconv.Itoa(limit))
	fq.Set("offset", strconv.Itoa(offset))
	gate := gateFor(q.Get("content_limit"))
	gate.apply(fq)

	var rec catalogLabelRecord
	if err := c.getV1(ctx, fmt.Sprintf("/catalog/labels/%d", id), fq, &rec); err != nil {
		return nil, err
	}
	refs := make([]catalogWorkRef, 0, len(rec.Works))
	for i := range rec.Works {
		refs = append(refs, rec.Works[i].Work)
	}
	briefs, err := c.hydrateWorkRefs(ctx, refs, gate)
	if err != nil {
		return nil, err
	}
	link := ""
	if len(rec.Links) > 0 {
		link = rec.Links[0].URL
	}
	aliases := rec.Aliases
	if aliases == nil {
		aliases = []string{}
	}
	return json.Marshal(map[string]any{
		"official": catalogOfficialBrief{
			ID:           rec.ID,
			Name:         rec.DisplayName,
			Aliases:      aliases,
			Category:     rec.Kind,
			Lang:         productLangFromCatalog(rec.Lang),
			Link:         link,
			Description:  preferredIntro(rec.Intros),
			GalgameCount: rec.WorkCount,
		},
		"galgames": briefs,
		"total":    rec.WorkCount,
	})
}

// hydrateWorkRefs turns a page of thin work references into the full briefs the
// cards need, with ONE works?ids= call. Withdrawn claims are dropped (the same
// gate every other read applies); order is preserved, because the entity page's
// ordering is the catalog's answer and re-sorting it here would be inventing a
// ranking.
func (c *Client) hydrateWorkRefs(ctx context.Context, refs []catalogWorkRef, gate catalogGate) ([]GalgameBrief, error) {
	out := make([]GalgameBrief, 0, len(refs))
	if len(refs) == 0 {
		return out, nil
	}
	ids := make([]int64, 0, len(refs))
	for _, r := range refs {
		if r.ClaimedBy.renderable() {
			ids = append(ids, r.ID)
		}
	}
	if len(ids) == 0 {
		return out, nil
	}
	q := url.Values{}
	q.Set("ids", joinInt64s(ids))
	q.Set("include", "names,covers,refs")
	q.Set("limit", strconv.Itoa(CatalogWorksIDsMax))
	gate.apply(q)

	var data catalogWorksListData
	if err := c.getV1(ctx, "/catalog/works", q, &data); err != nil {
		return nil, err
	}
	byID := make(map[int64]*catalogWorkListItem, len(data.Items))
	for i := range data.Items {
		byID[data.Items[i].ID] = &data.Items[i]
	}
	for _, r := range refs {
		if it, ok := byID[r.ID]; ok {
			out = append(out, catalogItemToBrief(it))
		}
	}
	return out, nil
}
