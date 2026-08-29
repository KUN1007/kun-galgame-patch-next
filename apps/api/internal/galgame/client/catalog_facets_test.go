package client

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync"
	"testing"
)

func TestFacetTagsPicksTheDistinctiveCoreShelf(t *testing.T) {
	tags := []catalogWorkTag{
		{Name: "Galgame", CanonicalID: 4, Tier: "hidden", Kind: "meta", Count: 5068},
		{Name: "司田カズヒロ", Tier: "", Kind: "", Count: 0},
		{Name: "男性主人公", CanonicalID: 10, Tier: "core", Kind: "content", Count: 7465},
		{Name: "萝莉", CanonicalID: 1444, Tier: "longtail", Kind: "content", Count: 518},
		{Name: "北欧神话", CanonicalID: 20, Tier: "core", Kind: "content", Count: 32},
		{Name: "破处", CanonicalID: 30, Tier: "core", Kind: "content", Count: 4248, Sexual: true},
		{Name: "结局", CanonicalID: 40, Tier: "core", Kind: "content", Count: 99, Spoiler: 1},
		{Name: "超能力", CanonicalID: 50, Tier: "core", Kind: "content", Count: 174},
	}

	got := facetTags(tags)
	want := []string{"北欧神话", "超能力", "破处", "男性主人公"}
	if len(got) != len(want) {
		t.Fatalf("picked %d tags, want %d: %+v", len(got), len(want), got)
	}
	for i, name := range want {
		if got[i].name != name {
			t.Errorf("tag %d = %q, want %q", i, got[i].name, name)
		}
	}

	entry := facetEntry{tags: got}
	sfw := entry.facet(false)
	for _, tag := range sfw.Tags {
		if tag.Name == "破处" {
			t.Error("a sexual tag reached an SFW reader's shelf")
		}
	}
	if len(entry.facet(true).Tags) != len(want) {
		t.Errorf("nsfw shelf = %d tags, want %d", len(entry.facet(true).Tags), len(want))
	}
}

func TestFacetFromReadsOnlyTheTwoCreditedRoles(t *testing.T) {
	credits := []catalogCreditGroup{
		{RoleKey: "voice-actor", Credits: []catalogCreditItem{
			{catalogPersonRef: catalogPersonRef{ID: 1, DisplayName: "声優A"}},
		}},
		// 剧本 and 原画 are the same roles under bangumi's vocabulary; the fold
		// is what makes them findable under the shared key.
		{RoleKey: "剧本", Credits: []catalogCreditItem{
			{catalogPersonRef: catalogPersonRef{ID: 2, DisplayName: "なかひろ"}},
		}},
		{RoleKey: "illustration", Credits: []catalogCreditItem{
			{catalogPersonRef: catalogPersonRef{ID: 3, DisplayName: "司田カズヒロ"}},
			{catalogPersonRef: catalogPersonRef{ID: 4, DisplayName: "なつめえり"}},
			{catalogPersonRef: catalogPersonRef{ID: 5, DisplayName: "ミズタマ"}},
		}},
	}

	got := facetFrom(catalogWork{Credits: credits})
	if len(got.scenario) != 1 || got.scenario[0].JaJp != "なかひろ" {
		t.Errorf("scenario = %+v, want the folded 剧本 credit", got.scenario)
	}
	if len(got.illustration) != facetStaffMax {
		t.Errorf("illustration = %d names, want the %d-name cap", len(got.illustration), facetStaffMax)
	}
}

// The shelf used to cost one detail read per work; catalog's list face answers
// tags and credits since 2026-08, so a page must resolve in the gid lookup plus
// exactly one works read no matter how many cards it holds.
func TestGalgameFacetsDrawsThePageInOneWorksRead(t *testing.T) {
	var mu sync.Mutex
	var works []url.Values

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		q := req.URL.Query()
		w.Header().Set("Content-Type", "application/json")
		if req.URL.Path != "/v2/catalog/works" {
			t.Errorf("unexpected path %q — the facet must not fall back to a detail read", req.URL.Path)
			w.WriteHeader(http.StatusNotFound)
			return
		}
		if q.Get("refs") != "" {
			_, _ = w.Write([]byte(`{"items":[
				{"id":"901","refs":[{"source":"curated","external_id":"11"}]},
				{"id":"902","refs":[{"source":"curated","external_id":"22"}]}
			]}`))
			return
		}
		mu.Lock()
		works = append(works, q)
		mu.Unlock()
		_, _ = w.Write([]byte(`{"items":[
			{"id":"901",
			 "tags":[{"id":"20","display_name":"北欧神话","tier":"core","tag_kind":"content","spoiler":"none","work_count":32}],
			 "credits":[{"role_key":"scenario","credits":[{"id":"7","display_name":"なかひろ"}]}]},
			{"id":"902","tags":[],"credits":[]}
		]}`))
	}))
	t.Cleanup(srv.Close)

	got := NewWithKey(srv.URL, "nm_test_key").GalgameFacets(context.Background(), []int{11, 22}, "sfw")

	if len(works) != 1 {
		t.Fatalf("issued %d works reads, want exactly 1", len(works))
	}
	if inc := works[0].Get("include"); inc != "tags,credits" {
		t.Errorf("include = %q, want tags,credits", inc)
	}
	if nsfw := works[0].Get("nsfw"); nsfw != "true" {
		t.Errorf("nsfw = %q — the gate must stay open so sexual tags can be filtered here", nsfw)
	}
	if cl := works[0].Get("content_limit"); cl != "" {
		t.Errorf("content_limit = %q, want unset: the caller already picked the works", cl)
	}
	if ids := works[0].Get("ids"); !strings.Contains(ids, "901") || !strings.Contains(ids, "902") {
		t.Errorf("ids = %q, want both resolved works", ids)
	}

	if len(got) != 1 {
		t.Fatalf("facets = %+v, want only the work that had something to show", got)
	}
	f, ok := got[11]
	if !ok {
		t.Fatalf("gid 11 missing from %+v", got)
	}
	if len(f.Tags) != 1 || f.Tags[0].Name != "北欧神话" || f.Tags[0].ID != 20 {
		t.Errorf("tags = %+v, want the core content shelf", f.Tags)
	}
	if len(f.Scenario) != 1 || f.Scenario[0].JaJp != "なかひろ" {
		t.Errorf("scenario = %+v, want the credited writer", f.Scenario)
	}
}
