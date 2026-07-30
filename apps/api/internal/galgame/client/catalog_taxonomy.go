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
//	              redirect shells. Each page is two reads with two jobs: the
//	              entity RECORD supplies the header, and the works SEARCH face
//	              supplies the member list AND its count under one claim gate
//	              (taxonomyMembers). The record's own work_count is registry-wide
//	              and is not the page's number.
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

// taxonomyPageWindow reads moyu's page/limit for a browse page. Both pass
// straight to the works SEARCH face, which is 1-based page-paginated — the
// shape these pages need, because their pagination is crawlable `?page=N`
// links rather than a cursor the crawler cannot construct.
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
	Sexual bool `json:"sexual"`
	// WorkCount is the REGISTRY-caliber member count: every galgame carrying this
	// tag, claimed or not. It is deliberately not read here — a browse page's
	// number must count the gated list it labels (see taxonomyMembers) — and is
	// kept on the struct so the next reader can see the record carries it and
	// what it means. The entity INDEX cards, whose subject IS the registry, are
	// the lane that legitimately shows it.
	WorkCount int               `json:"work_count"`
	Intros    []catalogIntroRow `json:"intros"`
}

type catalogLabelLink struct {
	Source string `json:"source"`
	URL    string `json:"url"`
}

type catalogLabelRecord struct {
	ID          int64              `json:"id"`
	DisplayName string             `json:"display_name"`
	Kind        string             `json:"kind"`
	Lang        string             `json:"lang"`
	Aliases     []string           `json:"aliases"`
	WorkCount   int                `json:"work_count"` // registry-caliber; see catalogTagRecord.WorkCount
	Intros      []catalogIntroRow  `json:"intros"`
	Links       []catalogLabelLink `json:"links"`
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

// catalogTagDetail composes the tag page: the canonical tag record for the
// header, and one page of its member works from the gated search face.
func (c *Client) catalogTagDetail(ctx context.Context, idStr string, q url.Values) (json.RawMessage, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(idStr), 10, 64)
	if err != nil || id <= 0 {
		return nil, &GalgameError{Code: galgameCodeNotFound, Message: "tag not found"}
	}
	gate := gateFor(q.Get("content_limit"))

	// The record read is for the page HEADER only — the tag's name, safety flag
	// and description. It takes no filter parameters (and moyu asks for no works
	// block, so its nsfw-aware work_count is never read); the gate belongs to the
	// member search below, which is where every number on the page comes from.
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
			ID:      rec.ID,
			Name:    rec.Name,
			Aliases: []string{},
			// Same derivation as the work detail's tags[]: a sexual-flagged tag
			// reads "sexual", everything else "content". Keeps every consumer
			// that keys on the literal string working off one boolean.
			Category:    tagCategoryFor(rec.Sexual),
			Sexual:      rec.Sexual,
			Description: preferredIntro(rec.Intros),
			// The page renders this as "N 个 Galgame" directly above the list and
			// puts it in the SEO description, so it must count the list it sits
			// on — the gated total, not the record's registry-caliber work_count.
			GalgameCount: int(total),
			Tier:         rec.Tier,
			Kind:         rec.Kind,
		},
		"galgames": members,
		"total":    total,
	})
}

// catalogLabelDetail composes the official ("label") page the same way.
func (c *Client) catalogLabelDetail(ctx context.Context, idStr string, q url.Values) (json.RawMessage, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(idStr), 10, 64)
	if err != nil || id <= 0 {
		return nil, &GalgameError{Code: galgameCodeNotFound, Message: "official not found"}
	}
	gate := gateFor(q.Get("content_limit"))

	// Header-only, exactly as catalogTagDetail's record read.
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
	aliases := rec.Aliases
	if aliases == nil {
		aliases = []string{}
	}
	return json.Marshal(map[string]any{
		"official": catalogOfficialBrief{
			ID:          rec.ID,
			Name:        rec.DisplayName,
			Aliases:     aliases,
			Category:    rec.Kind,
			Lang:        productLangFromCatalog(rec.Lang),
			Link:        link,
			Description: preferredIntro(rec.Intros),
			// The gated total, for the reason catalogTagDetail states.
			GalgameCount: int(total),
		},
		"galgames": members,
		"total":    total,
	})
}

// taxonomyMemberSort orders a browse page's member list. The face's default
// (relevance) is meaningless without a query, and the list this replaced came
// back in catalog-work-id order — an insertion artefact no reader can interpret.
// Newest-first is the ordering such a page wants, and it is DETERMINISTIC, which
// crawlable ?page=N links require: a page 2 that reshuffles behind the crawler
// both duplicates and drops rows.
const taxonomyMemberSort = "released_desc"

// taxonomyMembers reads ONE page of an entity's member works from the works
// product search, filtered by `filterKey` (tag_id / label_id) and gated to the
// published population.
//
// This lane used to be ref-set hydration: ask the entity record for a page of
// work references (include=works), drop the ones failing renderable(), then
// hydrate the survivors with works?ids=. Three faults, all of them the search
// incident's (doc 106 §37) in a different lane:
//
//   - `renderable()` passes an ABSENT claim, so the registry's unclaimed bulk
//     and every unpublished draft rendered as cards on a public, crawlable page.
//   - the page's `total` came from the entity record's work_count — the whole
//     registry population under no claim gate at all — so the pager advertised
//     pages that were empty or full of rows the page should never have had.
//   - two numbers from two calls, which is how those two could disagree.
//
// Now the members and the count come from ONE gated response, so they cannot.
func (c *Client) taxonomyMembers(ctx context.Context, filterKey string, id int64, q url.Values, gate catalogGate) ([]GalgameBrief, int64, error) {
	page, limit := taxonomyPageWindow(q)

	fq := url.Values{}
	fq.Set(filterKey, strconv.FormatInt(id, 10))
	// The population gate, identical to SearchGalgame's and for the same reason.
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
