package client

// Face-selection tests: prove the galgame client routes each call to the right
// face by ROUTE membership, not HTTP method. Since open-API phase 2 wave 07
// (route-B endgame) the A-bucket READ set — search / batch / detail / month
// calendar + the taxonomy reads (tag/official list/search/multi/detail, engine
// list, series list) — hits the {base}/v1 public face + X-API-Key, and since
// wave A1 the vndb reverse lookup hits the same base's CATALOG surface
// (/v1/catalog/lookup). The B-bucket platform-workflow reads (/galgame/mine,
// /galgame/messages/mine, the publish picker's status=0,2 search, taxonomy
// /:id/revisions), the S2S message feed, and
// the user write set (submit / draft update+delete / claim / image upload /
// links+aliases relation edits, wave 06a) stay on {base}/internal + key; only
// the staff taxonomy CRUD/revert + /admin/* stay on legacy {base}/api. The
// internal + v1 faces hard-depend on the internal-tier key — the empty-key
// rollback to legacy was retired in wave 05. Deterministic — a fake service
// records the last request.

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync"
	"testing"
)

// faceRecorder captures the last request the fake service received.
type faceRecorder struct {
	mu     sync.Mutex
	path   string
	query  url.Values
	apiKey string
	auth   string
}

func (r *faceRecorder) server(t *testing.T) *httptest.Server {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		r.mu.Lock()
		r.path = req.URL.Path
		r.query = req.URL.Query()
		r.apiKey = req.Header.Get("X-API-Key")
		r.auth = req.Header.Get("Authorization")
		r.mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		// A valid empty envelope: unmarshals into every response type used below
		// (detail struct, paginated {items,total}, search-pending) as zero values.
		_, _ = w.Write([]byte(`{"code":0,"message":"ok","data":{}}`))
	}))
	t.Cleanup(srv.Close)
	return srv
}

// TestFaceSelection_WithKey proves that, with an internal-tier key configured,
// reads (and the S2S message feed) hit {base}/internal + X-API-Key (personalized
// reads additionally carry the user JWT on Authorization — dual credential),
// the user write set (submit / update / draft patch+delete / claim / image
// upload / links+aliases relation edits) also hits {base}/internal with dual
// credentials (X-API-Key + Bearer), and only the staff taxonomy CRUD/revert +
// /admin/* proxies stay on {base}/api with no key.
func TestFaceSelection_WithKey(t *testing.T) {
	rec := &faceRecorder{}
	srv := rec.server(t)
	c := NewWithKey(srv.URL, "nm_test_key")
	ctx := context.Background()

	// The gid-keyed reads are two-hop and get their own fixture-backed tests
	// (TestCatalogTwoHopReads); the calendar is month-keyed, so it reaches the
	// catalog face in one call and can pin the credential shape here.
	t.Run("anonymous calendar read → v1 catalog + key", func(t *testing.T) {
		if _, err := c.GetGalgameCalendar(ctx, "2026-07", ""); err != nil {
			t.Fatalf("GetGalgameCalendar: %v", err)
		}
		if rec.path != "/v1/catalog/calendar" {
			t.Errorf("path = %q, want /v1/catalog/calendar", rec.path)
		}
		if rec.apiKey != "nm_test_key" {
			t.Errorf("X-API-Key = %q, want nm_test_key", rec.apiKey)
		}
		if rec.auth != "" {
			t.Errorf("Authorization = %q, want empty on anonymous read", rec.auth)
		}
	})

}

// TestV1ReadRouting proves every A-bucket read routes to the {base}/v1 face with
// the internal-tier key (route-B endgame, wave 07; catalog lookup added in wave
// A1). The composed taxonomy detail reads make two /v1 calls; the recorder
// captures the last (the reverse-lookup), which is sufficient to prove the face.
func TestV1ReadRouting(t *testing.T) {
	rec := &faceRecorder{}
	srv := rec.server(t)
	c := NewWithKey(srv.URL, "nm_test_key")
	ctx := context.Background()

	check := func(t *testing.T, wantPath string, call func() error) {
		t.Helper()
		if err := call(); err != nil {
			t.Fatalf("call: %v", err)
		}
		if rec.path != wantPath {
			t.Errorf("path = %q, want %q", rec.path, wantPath)
		}
		if rec.apiKey != "nm_test_key" {
			t.Errorf("X-API-Key = %q, want nm_test_key", rec.apiKey)
		}
	}

	t.Run("search → v1 catalog works search", func(t *testing.T) {
		check(t, "/v1/catalog/works/search", func() error { _, e := c.SearchGalgame(ctx, SearchGalgameParams{Q: "x"}); return e })
	})
	t.Run("calendar → v1 catalog", func(t *testing.T) {
		check(t, "/v1/catalog/calendar", func() error { _, e := c.GetGalgameCalendar(ctx, "", ""); return e })
	})
	// The vndb reverse lookup reads the CATALOG face (wave A1). nsfw=1 is
	// load-bearing: without it every r18 work answers 404 and moyu — largely an
	// r18 patch site — would silently report "not in catalog" for most of its
	// archive.
	t.Run("vndb lookup → v1 catalog", func(t *testing.T) {
		check(t, "/v1/catalog/lookup", func() error { _, _, e := c.CheckGalgameByVndbID(ctx, "v1"); return e })
		if got := rec.query.Get("source"); got != "vndb" {
			t.Errorf("source = %q, want vndb", got)
		}
		if got := rec.query.Get("external_id"); got != "v1" {
			t.Errorf("external_id = %q, want v1", got)
		}
		if got := rec.query.Get("nsfw"); got != "1" {
			t.Errorf("nsfw = %q, want 1 (r18 works are hidden without it)", got)
		}
	})

}

// TestCatalogTwoHopReads pins the SEQUENCE of the gid-keyed reads, which is the
// part a single-request recorder cannot see: moyu is gid-native and the catalog
// addresses works by its own id, so every one of these resolves through the
// reverse lookup first and hydrates second (refs/proj/106 R3).
//
// It also pins the include tokens. They are not cosmetic — drop `refs` and
// every brief loses its vndb_id, which is what the search page joins its local
// patch rows on; drop `names` and every card renders untitled.
func TestCatalogTwoHopReads(t *testing.T) {
	srv := newCatalogFake(t)
	c := NewWithKey(srv.URL, "nm_test_key")
	ctx := context.Background()

	t.Run("batch = lookup/batch then works?ids=", func(t *testing.T) {
		srv.reset()
		briefs, err := c.GalgameBatch(ctx, []int{7}, "")
		if err != nil {
			t.Fatalf("GalgameBatch: %v", err)
		}
		srv.wantPaths(t, "/v1/catalog/lookup/batch", "/v1/catalog/works")
		last := srv.last()
		if got := last.query.Get("ids"); got != "900" {
			t.Errorf("ids = %q, want the CATALOG id 900 (not the gid)", got)
		}
		if got := last.query.Get("include"); got != "names,covers,refs" {
			t.Errorf("include = %q, want names,covers,refs", got)
		}
		if len(briefs) != 1 || briefs[0].ID != 7 {
			t.Fatalf("briefs = %+v, want one row keyed by gid 7", briefs)
		}
		if briefs[0].VndbID != "v42" {
			t.Errorf("vndb_id = %q, want v42 (from include=refs)", briefs[0].VndbID)
		}
		if briefs[0].CatalogWorkID != 900 {
			t.Errorf("catalog_work_id = %d, want 900", briefs[0].CatalogWorkID)
		}
	})

	t.Run("gid→catalog id is cached across calls", func(t *testing.T) {
		srv.reset()
		if _, err := c.GalgameBatch(ctx, []int{7}, ""); err != nil {
			t.Fatalf("GalgameBatch: %v", err)
		}
		// Second call for the same gid must NOT repeat the lookup: the mapping
		// is an identity, and the claim state it would refresh is read from the
		// hydration response anyway.
		srv.wantPaths(t, "/v1/catalog/works")
	})

	t.Run("detail = lookup then works/{id}", func(t *testing.T) {
		srv.reset()
		env, err := c.GetGalgame(ctx, 8, "")
		if err != nil {
			t.Fatalf("GetGalgame: %v", err)
		}
		srv.wantPaths(t, "/v1/catalog/lookup", "/v1/catalog/works/901")
		if got := srv.last().query.Get("spoilers"); got != "2" {
			t.Errorf("spoilers = %q, want 2 — moyu filters spoilers itself and needs every edge", got)
		}
		if env.Galgame.ID != 8 {
			t.Errorf("detail id = %d, want the gid 8", env.Galgame.ID)
		}
	})

	t.Run("search hits the works product search", func(t *testing.T) {
		srv.reset()
		if _, err := c.SearchGalgame(ctx, SearchGalgameParams{Q: "x", ContentLimit: "sfw"}); err != nil {
			t.Fatalf("SearchGalgame: %v", err)
		}
		srv.wantPaths(t, "/v1/catalog/works/search")
		// nsfw=1 even for an sfw caller: the AGE axis never stands in for the
		// editing one (doc 106 §38). TestContentLimitCaliber owns that contract.
		if got := srv.last().query.Get("nsfw"); got != "1" {
			t.Errorf("nsfw = %q, want 1 — moyu always reads the whole population", got)
		}
		// Absent by default, so the narrow high-precision search is what an
		// unmodified caller gets.
		if got := srv.last().query.Get("search_intro"); got != "" {
			t.Errorf("search_intro = %q, want absent unless asked for", got)
		}
	})

	// The synopsis lane (A2-1f). It is opt-in on the wire because it is opt-in
	// in the UI — the checkbox went away for one wave when the catalog index had
	// no synopsis to search, and an accepted-but-ignored flag would have been a
	// promise the face could not keep.
	t.Run("search_intro rides the wire when asked for", func(t *testing.T) {
		srv.reset()
		_, err := c.SearchGalgame(ctx, SearchGalgameParams{Q: "x", SearchIntro: true})
		if err != nil {
			t.Fatalf("SearchGalgame: %v", err)
		}
		if got := srv.last().query.Get("search_intro"); got != "1" {
			t.Errorf("search_intro = %q, want 1", got)
		}
	})
}

// TestContentLimitCaliber pins the wave's whole reason for existing: moyu's
// content_limit is the EDITING axis and must never be spoken as the age axis.
//
// The regression it guards is doc 106 §38, which shipped: `sfw` was projected
// onto nsfw=0, which on this archive hides 94.5% of the site, and `nsfw` onto
// content_rating=r18, a set that overlaps the intended one by about half. Every
// assertion below fails loudly if either projection comes back.
func TestContentLimitCaliber(t *testing.T) {
	srv := newCatalogFake(t)
	c := NewWithKey(srv.URL, "nm_test_key")
	ctx := context.Background()

	t.Run("the three values ride the wire as the editing axis", func(t *testing.T) {
		for _, tc := range []struct {
			cl        string
			wantLimit string
		}{
			{"sfw", "sfw"},
			{"nsfw", "nsfw"},
			{"all", ""},
			{"", ""},
		} {
			srv.reset()
			if _, err := c.SearchGalgame(ctx, SearchGalgameParams{Q: "x", ContentLimit: tc.cl}); err != nil {
				t.Fatalf("SearchGalgame(%q): %v", tc.cl, err)
			}
			q := srv.last().query
			if got := q.Get("nsfw"); got != "1" {
				t.Errorf("content_limit=%q: nsfw = %q, want 1 unconditionally", tc.cl, got)
			}
			if got := q.Get("content_limit"); got != tc.wantLimit {
				t.Errorf("content_limit=%q: wire content_limit = %q, want %q", tc.cl, got, tc.wantLimit)
			}
			// The age axis is NOT how a content_limit is expressed. `nsfw` in
			// particular must not become content_rating=r18 again.
			if got := q.Get("content_rating"); got != "" {
				t.Errorf("content_limit=%q: content_rating = %q, want absent — that is the AGE axis", tc.cl, got)
			}
		}
	})

	// age_limit=r18 is the caller genuinely asking for 18+, and the one place the
	// age axis is still spoken. It composes with the editing axis rather than
	// replacing it.
	t.Run("age_limit is the only content_rating caller", func(t *testing.T) {
		srv.reset()
		if _, err := c.SearchGalgame(ctx, SearchGalgameParams{Q: "x", AgeLimit: "r18", ContentLimit: "sfw"}); err != nil {
			t.Fatalf("SearchGalgame: %v", err)
		}
		q := srv.last().query
		if got := q.Get("content_rating"); got != "r18" {
			t.Errorf("content_rating = %q, want r18", got)
		}
		if got := q.Get("content_limit"); got != "sfw" {
			t.Errorf("content_limit = %q, want sfw — the two axes compose", got)
		}
	})

	t.Run("batch and calendar carry the same gate", func(t *testing.T) {
		srv.reset()
		if _, err := c.GalgameBatch(ctx, []int{7}, "sfw"); err != nil {
			t.Fatalf("GalgameBatch: %v", err)
		}
		q := srv.last().query
		if q.Get("nsfw") != "1" || q.Get("content_limit") != "sfw" {
			t.Errorf("works list gate = nsfw %q / content_limit %q, want 1 / sfw", q.Get("nsfw"), q.Get("content_limit"))
		}

		srv.reset()
		if _, err := c.GetGalgameCalendar(ctx, "2026-07", "nsfw"); err != nil {
			t.Fatalf("GetGalgameCalendar: %v", err)
		}
		q = srv.last().query
		if q.Get("nsfw") != "1" || q.Get("content_limit") != "nsfw" {
			t.Errorf("calendar gate = nsfw %q / content_limit %q, want 1 / nsfw", q.Get("nsfw"), q.Get("content_limit"))
		}
	})

	// gid 22 is rated r18 and edited sfw. Rendering the rating would label it
	// NSFW on every card — the SEO collapse the incident report opens with.
	t.Run("the rendered content_limit is the claim's, not the rating's", func(t *testing.T) {
		srv.reset()
		briefs, err := c.GalgameBatch(ctx, []int{22}, "")
		if err != nil {
			t.Fatalf("GalgameBatch: %v", err)
		}
		if len(briefs) != 1 {
			t.Fatalf("briefs = %+v, want the one live row", briefs)
		}
		if got := briefs[0].ContentLimit; got != "sfw" {
			t.Errorf("content_limit = %q, want sfw (claimed_by.content_limit)", got)
		}
		if got := briefs[0].AgeLimit; got != "r18" {
			t.Errorf("age_limit = %q, want r18 — the AGE axis is untouched", got)
		}
	})

	// The detail face takes no content_limit= parameter, so the gate lands on the
	// single row it answers with — the wiki detail's own 404-on-mismatch.
	t.Run("detail gates the row it fetched", func(t *testing.T) {
		srv.reset()
		if _, err := c.GetGalgame(ctx, 22, "sfw"); err != nil {
			t.Fatalf("GetGalgame(sfw) on an sfw-edited entry: %v", err)
		}
		q := srv.last().query
		if got := q.Get("nsfw"); got != "1" {
			t.Errorf("detail nsfw = %q, want 1 — an r18-rated entry 404s without it", got)
		}
		if got := q.Get("content_limit"); got != "" {
			t.Errorf("detail content_limit = %q, want absent — that face has no such parameter", got)
		}
		if _, err := c.GetGalgame(ctx, 22, "nsfw"); err == nil {
			t.Error("GetGalgame(nsfw) on an sfw-edited entry: want not-found, got nil")
		}
		if _, err := c.GetGalgame(ctx, 22, ""); err != nil {
			t.Errorf("GetGalgame(no filter): %v", err)
		}
	})
}

// TestContentAxisProjection pins the projection itself, including the branch the
// fake cannot reach end to end: a work NO wiki entry claims has no edited body,
// so the age rating is the only evidence there is and stands in conservatively.
func TestContentAxisProjection(t *testing.T) {
	claim := func(limit string) *catalogClaimedBy {
		return &catalogClaimedBy{Site: catalogClaimSiteKungal, WorkID: 1, State: catalogClaimStateLive, ContentLimit: limit}
	}
	for _, tc := range []struct {
		name            string
		claim           *catalogClaimedBy
		rating          string
		wantCL, wantAge string
	}{
		{"claimed sfw, rated r18", claim("sfw"), "r18", "sfw", "r18"},
		{"claimed nsfw, rated all_ages", claim("nsfw"), "all_ages", "nsfw", "all"},
		{"unclaimed r18 falls back to nsfw", nil, "r18", "nsfw", "r18"},
		{"unclaimed sensitive falls back to sfw", nil, "sensitive", "sfw", "all"},
		{"a claim with no verdict falls back too", claim(""), "r18", "nsfw", "r18"},
		{"another product's claim is not moyu's", &catalogClaimedBy{Site: "letmoe", ContentLimit: "sfw"}, "r18", "nsfw", "r18"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			cl, age := contentAxisOf(tc.claim, tc.rating)
			if cl != tc.wantCL || age != tc.wantAge {
				t.Errorf("contentAxisOf = (%q, %q), want (%q, %q)", cl, age, tc.wantCL, tc.wantAge)
			}
		})
	}
}

// TestEffectiveBannerPrefersLandscape pins the cover flip (doc 106 §38, user
// order): moyu's effective banner is the WIDE art, as it was before the A2-2
// re-anchor started reading the catalog's portrait slot and visibly changed
// every cover on the site.
func TestEffectiveBannerPrefersLandscape(t *testing.T) {
	t.Run("list rows take the banner slot", func(t *testing.T) {
		portrait := &catalogCoverSlot{URL: "https://cdn/aa/bb/p.webp", Width: 600, Height: 800}
		banner := &catalogCoverSlot{URL: "https://cdn/aa/bb/b.webp", Width: 1280, Height: 720}
		for _, tc := range []struct {
			name string
			it   catalogWorkListItem
			want string
		}{
			{"both slots", catalogWorkListItem{Covers: &catalogCoverSlots{Portrait: portrait, Banner: banner}}, "b"},
			{"portrait only", catalogWorkListItem{Covers: &catalogCoverSlots{Portrait: portrait}}, "p"},
			{"no include=covers", catalogWorkListItem{Cover: "https://cdn/aa/bb/c.webp"}, "c"},
			{"no cover at all", catalogWorkListItem{}, ""},
		} {
			t.Run(tc.name, func(t *testing.T) {
				hash, _, _, _ := coverOf(&tc.it)
				if hash != tc.want {
					t.Errorf("coverOf hash = %q, want %q", hash, tc.want)
				}
			})
		}
	})

	t.Run("the detail hero takes the first landscape row", func(t *testing.T) {
		pinned := catalogDetailCover{URL: "https://cdn/aa/bb/p.webp", PortraitPinned: true, Width: 600, Height: 800}
		wide := catalogDetailCover{URL: "https://cdn/aa/bb/b.webp", Width: 1280, Height: 720}
		// No dimensions = unknown shape, NOT landscape.
		unknown := catalogDetailCover{URL: "https://cdn/aa/bb/u.webp"}
		for _, tc := range []struct {
			name   string
			covers []catalogDetailCover
			want   string
		}{
			{"landscape beats the portrait pin", []catalogDetailCover{pinned, wide}, "https://cdn/aa/bb/b.webp"},
			{"portrait-only falls back to the pin", []catalogDetailCover{unknown, pinned}, "https://cdn/aa/bb/p.webp"},
			{"nothing pinned falls back to the first", []catalogDetailCover{unknown}, "https://cdn/aa/bb/u.webp"},
			{"no covers", nil, ""},
		} {
			t.Run(tc.name, func(t *testing.T) {
				got := ""
				if c := heroCover(tc.covers); c != nil {
					got = c.URL
				}
				if got != tc.want {
					t.Errorf("heroCover = %q, want %q", got, tc.want)
				}
			})
		}
	})
}

// TestTagPageCarriesSafetyFlag pins the tag page's SAFETY axis end to end.
//
// The page's SEO gate is `!sexual`: a sexual tag's own name is an NSFW signal,
// so those pages stay out of the index. For one wave the canonical tag record
// carried no such flag and the page had to fall back to a blanket noindex;
// A2-1f put it on the record, so this asserts the value actually reaches the
// frontend — and that `category` is derived from the SAME boolean the work
// detail derives it from, since that one word drives both an SFW hard-hide and
// the SEO gate.
func TestTagPageCarriesSafetyFlag(t *testing.T) {
	srv := newCatalogFake(t)
	c := NewWithKey(srv.URL, "nm_test_key")
	ctx := context.Background()

	for _, tc := range []struct {
		name         string
		tagID        string
		wantSexual   bool
		wantCategory string
	}{
		{"a sexual tag", "12", true, "sexual"},
		{"an ordinary tag", "11", false, "content"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			srv.reset()
			raw, handled, err := c.TaxonomyBrowse(ctx, "/tag/_?tag_id="+tc.tagID)
			if err != nil || !handled {
				t.Fatalf("TaxonomyBrowse: handled=%v err=%v", handled, err)
			}
			var got struct {
				Tag struct {
					Sexual   bool   `json:"sexual"`
					Category string `json:"category"`
				} `json:"tag"`
			}
			if e := json.Unmarshal(raw, &got); e != nil {
				t.Fatalf("unmarshal: %v", e)
			}
			if got.Tag.Sexual != tc.wantSexual {
				t.Errorf("sexual = %v, want %v", got.Tag.Sexual, tc.wantSexual)
			}
			if got.Tag.Category != tc.wantCategory {
				t.Errorf("category = %q, want %q (derived from the same flag)", got.Tag.Category, tc.wantCategory)
			}
		})
	}
}

// TestClaimStateGating is the wave's most load-bearing test.
//
// The deprecated face served PUBLISHED entries only, and that filter silently
// doubled as moyu's ban gate. The catalog's claim projection is status-blind, so
// re-anchoring without honouring `state` would republish every banned and
// unpublished wiki entry. These assertions are what stands between the two.
func TestClaimStateGating(t *testing.T) {
	srv := newCatalogFake(t)
	c := NewWithKey(srv.URL, "nm_test_key")
	ctx := context.Background()

	t.Run("batch drops draft and hidden", func(t *testing.T) {
		srv.reset()
		briefs, err := c.GalgameBatch(ctx, []int{7, 20, 21}, "")
		if err != nil {
			t.Fatalf("GalgameBatch: %v", err)
		}
		if len(briefs) != 1 || briefs[0].ID != 7 {
			t.Fatalf("briefs = %+v, want only the live gid 7", briefs)
		}
	})

	t.Run("detail 404s a hidden entry", func(t *testing.T) {
		srv.reset()
		if _, err := c.GetGalgame(ctx, 21, ""); err == nil {
			t.Fatal("GetGalgame on a hidden entry: want an error, got nil")
		}
	})

	t.Run("calendar keeps draft, drops hidden", func(t *testing.T) {
		srv.reset()
		cal, err := c.GetGalgameCalendar(ctx, "2026-07", "")
		if err != nil {
			t.Fatalf("GetGalgameCalendar: %v", err)
		}
		var states []string
		for _, it := range cal.Items {
			states = append(states, it.ClaimState)
		}
		// live + draft + the claim-less "not on the forum" row survive; hidden does not.
		if len(states) != 3 {
			t.Fatalf("claim states = %v, want three rows (live, draft, unclaimed)", states)
		}
		for _, s := range states {
			if s == "hidden" {
				t.Errorf("claim states = %v, a hidden entry must never be rendered", states)
			}
		}
		if cal.Meta.MaxMonth != "2026-08" {
			t.Errorf("meta.max_month = %q, want 2026-08", cal.Meta.MaxMonth)
		}
		// prev/next are arithmetic on the served month, not data.
		if cal.Meta.PrevMonth != "2026-06" || cal.Meta.NextMonth != "2026-08" {
			t.Errorf("prev/next = %q/%q, want 2026-06/2026-08", cal.Meta.PrevMonth, cal.Meta.NextMonth)
		}
	})

	// Search is the lane that got this wrong in production (doc 106 §37): it
	// post-filtered on `renderable()`, which passes an ABSENT claim — and most of
	// the registry is unclaimed — so the public search page served the whole
	// cross-media catalog. The gate now rides the wire, and the two halves of that
	// are asserted separately: the request must carry it, and the response must
	// come back untouched.
	t.Run("search gates on the wire and re-filters nothing", func(t *testing.T) {
		srv.reset()
		res, err := c.SearchGalgame(ctx, SearchGalgameParams{Q: "x"})
		if err != nil {
			t.Fatalf("SearchGalgame: %v", err)
		}
		if got := srv.last().query.Get("claim_state"); got != "live" {
			t.Fatalf("claim_state = %q, want live — published-only is a REQUEST parameter now", got)
		}
		// The fake answers with draft / hidden / unclaimed rows on purpose. All
		// four must survive: a client-side gate would drop rows out of a page the
		// face already counted, so total would stop describing items and paging
		// would go lossy again.
		if len(res.Items) != 4 {
			t.Errorf("items = %d, want all 4 rows the face returned (no client-side filter)", len(res.Items))
		}
		if res.Total != 4 {
			t.Errorf("total = %d, want the face's 4 verbatim", res.Total)
		}
	})

	t.Run("claim states resolve in one hop", func(t *testing.T) {
		srv.reset()
		states, err := c.ClaimStates(ctx, []int{7, 20, 21})
		if err != nil {
			t.Fatalf("ClaimStates: %v", err)
		}
		srv.wantPaths(t, "/v1/catalog/lookup/batch")
		want := map[int]string{7: "live", 20: "draft", 21: "hidden"}
		for gid, w := range want {
			if states[gid] != w {
				t.Errorf("state[%d] = %q, want %q", gid, states[gid], w)
			}
		}
	})
}

// TestTaxonomyBrowseMembersAreGated pins the tag / official browse pages'
// member lane, the sibling of the search incident (doc 106 §37).
//
// These pages are public and crawlable, and they used to compose their list from
// the entity record's work refs under a `renderable()` filter — which passes an
// absent claim — while taking `total` from the record's registry-wide
// work_count. So they rendered unclaimed and draft works, and paged over a count
// no gate had ever touched. Members and count now come from ONE gated search
// response, which is what these assertions hold in place.
func TestTaxonomyBrowseMembersAreGated(t *testing.T) {
	srv := newCatalogFake(t)
	c := NewWithKey(srv.URL, "nm_test_key")
	ctx := context.Background()

	for _, tc := range []struct {
		name      string
		path      string
		recPath   string
		filterKey string
		filterVal string
		entity    string
	}{
		{"tag page", "/tag/_?tag_id=11&page=2&limit=10", "/v1/catalog/tags/11", "tag_id", "11", "tag"},
		{"official page", "/official/_?official_id=31&page=2&limit=10", "/v1/catalog/labels/31", "label_id", "31", "official"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			srv.reset()
			raw, handled, err := c.TaxonomyBrowse(ctx, tc.path)
			if err != nil || !handled {
				t.Fatalf("TaxonomyBrowse: handled=%v err=%v", handled, err)
			}
			// The record call is for the header only. It must NOT ask for works:
			// that include is what made the member set the record's to decide.
			srv.wantPaths(t, tc.recPath, "/v1/catalog/works/search")
			if got := srv.all()[0].query.Get("include"); got != "" {
				t.Errorf("record include = %q, want empty — the member list is the search face's job now", got)
			}

			q := srv.last().query
			if got := q.Get(tc.filterKey); got != tc.filterVal {
				t.Errorf("%s = %q, want %q", tc.filterKey, got, tc.filterVal)
			}
			if got := q.Get("claim_state"); got != "live" {
				t.Errorf("claim_state = %q, want live — a public browse page serves the published population", got)
			}
			// page/limit ride through as-is: these pages paginate with crawlable
			// ?page=N links, so the face must be the page-paginated one.
			if got, want := q.Get("page"), "2"; got != want {
				t.Errorf("page = %q, want %q", got, want)
			}
			if got, want := q.Get("limit"), "10"; got != want {
				t.Errorf("limit = %q, want %q", got, want)
			}
			if got := q.Get("sort"); got != "released_desc" {
				t.Errorf("sort = %q, want released_desc — ?page=N needs a deterministic order", got)
			}
			if got := q.Get("include"); got != "names,covers,refs" {
				t.Errorf("member include = %q, want names,covers,refs", got)
			}

			var got struct {
				Total    int64 `json:"total"`
				Galgames []struct {
					ID int `json:"id"`
				} `json:"galgames"`
				Tag struct {
					GalgameCount int `json:"galgame_count"`
				} `json:"tag"`
				Official struct {
					GalgameCount int `json:"galgame_count"`
				} `json:"official"`
			}
			if e := json.Unmarshal(raw, &got); e != nil {
				t.Fatalf("unmarshal: %v", e)
			}
			// The fake's search answers four rows — live, draft, hidden and
			// unclaimed — under total 4. All four arrive: the gate is the face's,
			// and a client-side re-filter would desync items from total again.
			if len(got.Galgames) != 4 {
				t.Errorf("galgames = %d, want the face's 4 rows verbatim", len(got.Galgames))
			}
			// 4 is the search's total; 3 is the record's registry-wide work_count.
			// Both numbers on the page must be the former.
			if got.Total != 4 {
				t.Errorf("total = %d, want 4 (the gated search's), not the record's 3", got.Total)
			}
			count := got.Tag.GalgameCount
			if tc.entity == "official" {
				count = got.Official.GalgameCount
			}
			if count != 4 {
				t.Errorf("%s.galgame_count = %d, want 4 — the header counts the list below it", tc.entity, count)
			}
		})
	}
}

// TestDeprecatedGalgameFaceIsUnreachable is the wave's residue gate: after the
// A2-2 re-anchor, NO read may touch /v1/galgame — that surface carries
// Deprecation + Sunset headers and is being taken down. A future edit that
// reintroduces a call there fails here rather than at the sunset.
func TestDeprecatedGalgameFaceIsUnreachable(t *testing.T) {
	srv := newCatalogFake(t)
	c := NewWithKey(srv.URL, "nm_test_key")
	ctx := context.Background()

	srv.reset()
	_, _ = c.GalgameBatch(ctx, []int{7}, "")
	_, _ = c.GetGalgame(ctx, 8, "")
	_, _ = c.GetGalgameCalendar(ctx, "2026-07", "")
	_, _ = c.SearchGalgame(ctx, SearchGalgameParams{Q: "x"})
	_, _, _ = c.CheckGalgameByVndbID(ctx, "v1")
	_, _, _ = c.TaxonomyBrowse(ctx, "/tag/_?tag_id=5")
	_, _, _ = c.TaxonomyBrowse(ctx, "/official/_?official_id=9")

	for _, r := range srv.all() {
		if strings.HasPrefix(r.path, "/v1/galgame") {
			t.Errorf("read dialed the DEPRECATED face %q — the whole point of wave A2-2 is that nothing does", r.path)
		}
	}
}

// TestRetiredTaxonomyListsAreUnhandled proves the earlier A2-2 retirement is
// real at the dispatcher, not just at the router: the bare tag / official LIST
// paths must be claimed by nothing — neither the catalog browse composer nor
// (through the back door) the staff rewriter.
func TestRetiredTaxonomyListsAreUnhandled(t *testing.T) {
	rec := &faceRecorder{}
	srv := rec.server(t)
	c := NewWithKey(srv.URL, "nm_test_key")
	ctx := context.Background()

	// The bare lists went in wave A2-2; the staff picker / edit-form read-back
	// lanes went with the console in wave 159. None of them may be resurrected
	// through the browse reader, and none may dial any face.
	for _, p := range []string{
		"/tag", "/tag?page=1", "/official", "/official?page=1",
		"/tag/search?q=x", "/official/search?q=x", "/engine", "/series?page=1",
		"/taxonomy/tag/42",
	} {
		rec.path = ""
		if _, handled, err := c.TaxonomyBrowse(ctx, p); handled || err != nil {
			t.Errorf("TaxonomyBrowse(%q) = handled %v, err %v; want handled=false, err=nil", p, handled, err)
		}
		if rec.path != "" {
			t.Errorf("TaxonomyBrowse(%q) dialed %q; a retired lane must not reach any face", p, rec.path)
		}
	}
}
