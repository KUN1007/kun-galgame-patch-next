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

	t.Run("token read /galgame/mine → internal + key + user JWT (dual credential)", func(t *testing.T) {
		if _, err := c.ListMyGalgames(ctx, "user-jwt", "", 0, 0); err != nil {
			t.Fatalf("ListMyGalgames: %v", err)
		}
		if rec.path != "/internal/galgame/mine" {
			t.Errorf("path = %q, want /internal/galgame/mine", rec.path)
		}
		if rec.apiKey != "nm_test_key" {
			t.Errorf("X-API-Key = %q, want nm_test_key", rec.apiKey)
		}
		if rec.auth != "Bearer user-jwt" {
			t.Errorf("Authorization = %q, want Bearer user-jwt", rec.auth)
		}
	})

	t.Run("token read /galgame/messages/mine → internal + key + user JWT", func(t *testing.T) {
		if _, err := c.GetMyGalgameMessages(ctx, "user-jwt", 0, 0); err != nil {
			t.Fatalf("GetMyGalgameMessages: %v", err)
		}
		if rec.path != "/internal/galgame/messages/mine" {
			t.Errorf("path = %q, want /internal/galgame/messages/mine", rec.path)
		}
		if rec.apiKey != "nm_test_key" {
			t.Errorf("X-API-Key = %q, want nm_test_key", rec.apiKey)
		}
		if rec.auth != "Bearer user-jwt" {
			t.Errorf("Authorization = %q, want Bearer user-jwt", rec.auth)
		}
	})

	// Platform-workflow read: the publish picker needs status=0,2 (claimable VNDB
	// drafts) + the caller's own pending submissions, neither of which the /v1
	// public face serves. Pinning the face here so it is never re-migrated.
	t.Run("publish search (include_pending) → internal + key + user JWT", func(t *testing.T) {
		if _, err := c.SearchGalgameForPublish(ctx, "user-jwt", "q", 0); err != nil {
			t.Fatalf("SearchGalgameForPublish: %v", err)
		}
		if rec.path != "/internal/galgame/search" {
			t.Errorf("path = %q, want /internal/galgame/search", rec.path)
		}
		if got := rec.query.Get("status"); got != "0,2" {
			t.Errorf("status = %q, want 0,2 (claimable VNDB drafts must be searchable)", got)
		}
		if rec.apiKey != "nm_test_key" {
			t.Errorf("X-API-Key = %q, want nm_test_key", rec.apiKey)
		}
		if rec.auth != "Bearer user-jwt" {
			t.Errorf("Authorization = %q, want Bearer user-jwt", rec.auth)
		}
	})

	t.Run("proxy GET (staff taxonomy read) → legacy /api, user Bearer, no key", func(t *testing.T) {
		if _, err := c.Proxy(ctx, http.MethodGet, "/tag/search?q=x", "user-jwt", nil, ""); err != nil {
			t.Fatalf("Proxy GET: %v", err)
		}
		if rec.path != "/api/tag/search" {
			t.Errorf("path = %q, want /api/tag/search", rec.path)
		}
		if rec.apiKey != "" {
			t.Errorf("X-API-Key = %q, want empty — the staff face authenticates the USER", rec.apiKey)
		}
	})

	t.Run("proxy GET (taxonomy B-bucket revisions) → internal + key", func(t *testing.T) {
		if _, err := c.Proxy(ctx, http.MethodGet, "/tag/5/revisions?page=1", "", nil, ""); err != nil {
			t.Fatalf("Proxy GET revisions: %v", err)
		}
		if rec.path != "/internal/tag/5/revisions" {
			t.Errorf("path = %q, want /internal/tag/5/revisions (B-bucket stays internal)", rec.path)
		}
		if rec.apiKey != "nm_test_key" {
			t.Errorf("X-API-Key = %q, want nm_test_key", rec.apiKey)
		}
	})

	t.Run("proxy POST (taxonomy tag write) → legacy, no key", func(t *testing.T) {
		if _, err := c.Proxy(ctx, http.MethodPost, "/tag", "user-jwt", []byte(`{}`), "application/json"); err != nil {
			t.Fatalf("Proxy POST: %v", err)
		}
		if rec.path != "/api/tag" {
			t.Errorf("path = %q, want /api/tag", rec.path)
		}
		if rec.apiKey != "" {
			t.Errorf("X-API-Key = %q, want empty on legacy write face", rec.apiKey)
		}
	})

	t.Run("proxy POST (series write, staff) → legacy, no key", func(t *testing.T) {
		if _, err := c.Proxy(ctx, http.MethodPost, "/series", "user-jwt", []byte(`{}`), "application/json"); err != nil {
			t.Fatalf("Proxy POST /series: %v", err)
		}
		if rec.path != "/api/series" {
			t.Errorf("path = %q, want /api/series (staff taxonomy stays legacy)", rec.path)
		}
		if rec.apiKey != "" {
			t.Errorf("X-API-Key = %q, want empty on legacy write face", rec.apiKey)
		}
	})

	t.Run("proxy PUT (series update, staff) → legacy, no key", func(t *testing.T) {
		if _, err := c.Proxy(ctx, http.MethodPut, "/series/9", "user-jwt", []byte(`{}`), "application/json"); err != nil {
			t.Fatalf("Proxy PUT /series/9: %v", err)
		}
		if rec.path != "/api/series/9" {
			t.Errorf("path = %q, want /api/series/9 (staff taxonomy stays legacy)", rec.path)
		}
		if rec.apiKey != "" {
			t.Errorf("X-API-Key = %q, want empty on legacy write face", rec.apiKey)
		}
	})

	t.Run("proxy POST /galgame/:gid/links (relation write) → internal + key + JWT", func(t *testing.T) {
		if _, err := c.Proxy(ctx, http.MethodPost, "/galgame/42/links", "user-jwt", []byte(`{}`), "application/json"); err != nil {
			t.Fatalf("Proxy POST links: %v", err)
		}
		if rec.path != "/internal/galgame/42/links" {
			t.Errorf("path = %q, want /internal/galgame/42/links", rec.path)
		}
		if rec.apiKey != "nm_test_key" {
			t.Errorf("X-API-Key = %q, want nm_test_key", rec.apiKey)
		}
		if rec.auth != "Bearer user-jwt" {
			t.Errorf("Authorization = %q, want Bearer user-jwt", rec.auth)
		}
	})

	t.Run("proxy DELETE /galgame/:gid/aliases (relation write) → internal + key + JWT", func(t *testing.T) {
		if _, err := c.Proxy(ctx, http.MethodDelete, "/galgame/42/aliases", "user-jwt", []byte(`{}`), "application/json"); err != nil {
			t.Fatalf("Proxy DELETE aliases: %v", err)
		}
		if rec.path != "/internal/galgame/42/aliases" {
			t.Errorf("path = %q, want /internal/galgame/42/aliases", rec.path)
		}
		if rec.apiKey != "nm_test_key" {
			t.Errorf("X-API-Key = %q, want nm_test_key", rec.apiKey)
		}
		if rec.auth != "Bearer user-jwt" {
			t.Errorf("Authorization = %q, want Bearer user-jwt", rec.auth)
		}
	})

	t.Run("submit write → internal + key + JWT", func(t *testing.T) {
		if _, err := c.SubmitGalgame(ctx, "user-jwt", map[string]any{"x": 1}); err != nil {
			t.Fatalf("SubmitGalgame: %v", err)
		}
		if rec.path != "/internal/galgame/submit" {
			t.Errorf("path = %q, want /internal/galgame/submit", rec.path)
		}
		if rec.apiKey != "nm_test_key" {
			t.Errorf("X-API-Key = %q, want nm_test_key", rec.apiKey)
		}
		if rec.auth != "Bearer user-jwt" {
			t.Errorf("Authorization = %q, want Bearer user-jwt", rec.auth)
		}
	})

	t.Run("claim write → internal + key + JWT", func(t *testing.T) {
		if _, err := c.ClaimGalgame(ctx, "user-jwt", 7); err != nil {
			t.Fatalf("ClaimGalgame: %v", err)
		}
		if rec.path != "/internal/galgame/7/claim" {
			t.Errorf("path = %q, want /internal/galgame/7/claim", rec.path)
		}
		if rec.apiKey != "nm_test_key" {
			t.Errorf("X-API-Key = %q, want nm_test_key", rec.apiKey)
		}
		if rec.auth != "Bearer user-jwt" {
			t.Errorf("Authorization = %q, want Bearer user-jwt", rec.auth)
		}
	})

	t.Run("patch draft write → internal + key + JWT", func(t *testing.T) {
		if _, err := c.PatchGalgameDraft(ctx, "user-jwt", 8, map[string]any{"x": 1}); err != nil {
			t.Fatalf("PatchGalgameDraft: %v", err)
		}
		if rec.path != "/internal/galgame/8" {
			t.Errorf("path = %q, want /internal/galgame/8", rec.path)
		}
		if rec.apiKey != "nm_test_key" {
			t.Errorf("X-API-Key = %q, want nm_test_key", rec.apiKey)
		}
		if rec.auth != "Bearer user-jwt" {
			t.Errorf("Authorization = %q, want Bearer user-jwt", rec.auth)
		}
	})

	t.Run("delete draft write → internal + key + JWT", func(t *testing.T) {
		if err := c.DeleteGalgameDraft(ctx, "user-jwt", 9); err != nil {
			t.Fatalf("DeleteGalgameDraft: %v", err)
		}
		if rec.path != "/internal/galgame/9" {
			t.Errorf("path = %q, want /internal/galgame/9", rec.path)
		}
		if rec.apiKey != "nm_test_key" {
			t.Errorf("X-API-Key = %q, want nm_test_key", rec.apiKey)
		}
		if rec.auth != "Bearer user-jwt" {
			t.Errorf("Authorization = %q, want Bearer user-jwt", rec.auth)
		}
	})

	t.Run("update write → internal + key + JWT", func(t *testing.T) {
		if _, err := c.UpdateGalgame(ctx, "user-jwt", 5, map[string]any{"x": 1}); err != nil {
			t.Fatalf("UpdateGalgame: %v", err)
		}
		if rec.path != "/internal/galgame/5" {
			t.Errorf("path = %q, want /internal/galgame/5", rec.path)
		}
		if rec.apiKey != "nm_test_key" {
			t.Errorf("X-API-Key = %q, want nm_test_key", rec.apiKey)
		}
		if rec.auth != "Bearer user-jwt" {
			t.Errorf("Authorization = %q, want Bearer user-jwt", rec.auth)
		}
	})

	t.Run("image upload proxy → internal + key + JWT", func(t *testing.T) {
		if _, err := c.UploadGalgameImage(ctx, "user-jwt", "galgame_cover", "f.png", []byte("x"), "image/png"); err != nil {
			t.Fatalf("UploadGalgameImage: %v", err)
		}
		if rec.path != "/internal/galgame/image" {
			t.Errorf("path = %q, want /internal/galgame/image", rec.path)
		}
		if rec.apiKey != "nm_test_key" {
			t.Errorf("X-API-Key = %q, want nm_test_key", rec.apiKey)
		}
		if rec.auth != "Bearer user-jwt" {
			t.Errorf("Authorization = %q, want Bearer user-jwt", rec.auth)
		}
	})

	t.Run("messages feed → internal + key (S2S cron)", func(t *testing.T) {
		if _, err := c.GetGalgameMessageFeed(ctx, 0, 10); err != nil {
			t.Fatalf("GetGalgameMessageFeed: %v", err)
		}
		if rec.path != "/internal/galgame/messages/feed" {
			t.Errorf("path = %q, want /internal/galgame/messages/feed", rec.path)
		}
		if rec.apiKey != "nm_test_key" {
			t.Errorf("X-API-Key = %q, want nm_test_key on internal feed face", rec.apiKey)
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

	// The STAFF taxonomy reads route to the surviving /api face with the user's
	// Bearer and NO service key: that face authenticates the USER (jwtAuth +
	// galgame.taxonomy.edit_any), and its ids are wiki taxonomy PKs — the same
	// key space the writes they feed take (refs/proj/106 R11).
	staffGet := func(p string) func() error {
		return func() error { _, e := c.Proxy(ctx, http.MethodGet, p, "user-jwt", nil, ""); return e }
	}
	staffCheck := func(t *testing.T, wantPath string, call func() error) {
		t.Helper()
		if err := call(); err != nil {
			t.Fatalf("call: %v", err)
		}
		if rec.path != wantPath {
			t.Errorf("path = %q, want %q", rec.path, wantPath)
		}
		if rec.apiKey != "" {
			t.Errorf("X-API-Key = %q, want empty on the staff face", rec.apiKey)
		}
		if rec.auth != "Bearer user-jwt" {
			t.Errorf("Authorization = %q, want the user Bearer", rec.auth)
		}
	}
	t.Run("tag search → api staff", func(t *testing.T) {
		staffCheck(t, "/api/tag/search", staffGet("/tag/search?q=x"))
	})
	t.Run("official search → api staff", func(t *testing.T) {
		staffCheck(t, "/api/official/search", staffGet("/official/search?q=x"))
	})
	// The engine / series bare lists are rewritten onto the staff `search` form:
	// same pane, but bounded.
	t.Run("engine list → api staff search", func(t *testing.T) {
		staffCheck(t, "/api/engine/search", staffGet("/engine"))
	})
	t.Run("series list → api staff search", func(t *testing.T) {
		staffCheck(t, "/api/series/search", staffGet("/series?page=1"))
	})
	t.Run("staff edit-form read-back → api staff record", func(t *testing.T) {
		staffCheck(t, "/api/tag/42", staffGet("/taxonomy/tag/42"))
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
		if got := srv.last().query.Get("nsfw"); got != "" {
			t.Errorf("nsfw = %q, want absent for an sfw caller", got)
		}
	})
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
	_, _ = c.Proxy(ctx, http.MethodGet, "/tag/_?tag_id=5", "", nil, "")
	_, _ = c.Proxy(ctx, http.MethodGet, "/official/_?official_id=9", "", nil, "")
	_, _ = c.Proxy(ctx, http.MethodGet, "/tag/search?q=x", "jwt", nil, "")

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

	for _, p := range []string{"/tag", "/tag?page=1", "/official", "/official?page=1"} {
		rec.path = ""
		if _, handled, err := c.proxyReadV1(ctx, p); handled || err != nil {
			t.Errorf("proxyReadV1(%q) = handled %v, err %v; want handled=false, err=nil", p, handled, err)
		}
		if _, ok := staffReadPath(p); ok {
			t.Errorf("staffReadPath(%q) claimed a retired lane", p)
		}
		if rec.path != "" {
			t.Errorf("proxyReadV1(%q) dialed %q; a retired lane must not reach any face", p, rec.path)
		}
	}
}

// TestMessageFeedRequiresKey proves the S2S message feed hard-depends on the
// internal-tier key: with no key configured it errors before dialing rather
// than silently falling back (the rollback valve was retired in wave 05).
func TestMessageFeedRequiresKey(t *testing.T) {
	rec := &faceRecorder{}
	srv := rec.server(t)
	c := NewWithKey(srv.URL, "") // no API key
	ctx := context.Background()

	if _, err := c.GetGalgameMessageFeed(ctx, 0, 10); err == nil {
		t.Fatal("GetGalgameMessageFeed with empty key: want error, got nil")
	}
	if rec.path != "" {
		t.Errorf("recorder path = %q, want empty (must not dial without a key)", rec.path)
	}
}
