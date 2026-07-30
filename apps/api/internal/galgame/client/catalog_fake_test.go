package client

// A hermetic fake of the /v1/catalog face, good enough to pin the shapes and
// the call sequence the wave-A2-2 re-anchor depends on. No external service,
// no database — httptest only, so these run anywhere.
//
// The fixture is deliberately tiny and deliberately three-state, because the
// claim state is what the whole wave turns on:
//
//	gid 7  -> catalog 900, claim live    (a published wiki entry)
//	gid 20 -> catalog 920, claim draft   (an unpublished one)
//	gid 21 -> catalog 921, claim hidden  (a withdrawn one — the ban case)
//	          catalog 930, NO claim      (a work no wiki entry covers at all)

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"testing"
)

type fakeReq struct {
	method string
	path   string
	query  url.Values
}

type catalogFake struct {
	*httptest.Server
	mu   sync.Mutex
	reqs []fakeReq
}

// gidFixture maps the fixture's gids to their catalog id and claim state.
var gidFixture = map[int]struct {
	catalogID int64
	state     string
}{
	7:  {900, catalogClaimStateLive},
	8:  {901, catalogClaimStateLive},
	20: {920, catalogClaimStateDraft},
	21: {921, catalogClaimStateHidden},
}

func newCatalogFake(t *testing.T) *catalogFake {
	t.Helper()
	f := &catalogFake{}
	f.Server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		f.mu.Lock()
		f.reqs = append(f.reqs, fakeReq{method: req.Method, path: req.URL.Path, query: req.URL.Query()})
		f.mu.Unlock()

		w.Header().Set("Content-Type", "application/json")
		body := f.route(req)
		_, _ = w.Write([]byte(`{"code":0,"message":"ok","data":` + body + `}`))
	}))
	t.Cleanup(f.Server.Close)
	return f
}

func (f *catalogFake) route(req *http.Request) string {
	p := req.URL.Path
	switch {
	case p == "/v1/catalog/lookup/batch":
		return f.lookupBatch(req)
	case p == "/v1/catalog/lookup":
		return f.lookupOne(req)
	case p == "/v1/catalog/works":
		return f.worksList(req)
	case p == "/v1/catalog/works/search":
		return f.search()
	case p == "/v1/catalog/calendar":
		return f.calendar()
	case strings.HasPrefix(p, "/v1/catalog/tags/"):
		return f.tagRecord(p)
	case strings.HasPrefix(p, "/v1/catalog/works/"):
		return f.workDetail(p)
	}
	return `{}`
}

// lookupBatch answers the reverse lookup for the fixture gids; an unknown
// external id comes back as a miss (null work), exactly as the real face does.
func (f *catalogFake) lookupBatch(req *http.Request) string {
	var body catalogLookupBatchRequest
	_ = json.NewDecoder(req.Body).Decode(&body)
	items := make([]string, 0, len(body.Items))
	for _, pair := range body.Items {
		gid, _ := strconv.Atoi(pair.ExternalID)
		fx, ok := gidFixture[gid]
		if !ok {
			items = append(items, `{"source":"galgame_wiki","external_id":"`+pair.ExternalID+`","work":null,"claimed_by":null}`)
			continue
		}
		items = append(items, `{"source":"galgame_wiki","external_id":"`+pair.ExternalID+`",`+
			`"work":{"id":`+strconv.FormatInt(fx.catalogID, 10)+`,"medium":"galgame","display_name":"W","content_rating":"all_ages"},`+
			`"claimed_by":`+claimJSON(gid, fx.state)+`}`)
	}
	return `{"items":[` + strings.Join(items, ",") + `]}`
}

func (f *catalogFake) lookupOne(req *http.Request) string {
	gid, _ := strconv.Atoi(req.URL.Query().Get("external_id"))
	fx, ok := gidFixture[gid]
	if !ok {
		return `{"work":null,"claimed_by":null}`
	}
	return `{"work":{"id":` + strconv.FormatInt(fx.catalogID, 10) + `,"medium":"galgame","display_name":"W","content_rating":"all_ages"},` +
		`"claimed_by":` + claimJSON(gid, fx.state) + `}`
}

// worksList echoes back one row per requested catalog id, carrying the claim
// state its gid was fixtured with.
func (f *catalogFake) worksList(req *http.Request) string {
	raw := req.URL.Query().Get("ids")
	items := make([]string, 0, 4)
	for _, s := range strings.Split(raw, ",") {
		id, err := strconv.ParseInt(strings.TrimSpace(s), 10, 64)
		if err != nil {
			continue
		}
		gid, state := gidForCatalogID(id)
		items = append(items, workItem(id, gid, state))
	}
	return `{"items":[` + strings.Join(items, ",") + `],"next_cursor":null}`
}

// tagRecord answers the canonical tag record. Tag 12 is the fixture's sexual
// one — the axis the page's SEO gate turns on.
func (f *catalogFake) tagRecord(path string) string {
	id, _ := strconv.ParseInt(strings.TrimPrefix(path, "/v1/catalog/tags/"), 10, 64)
	sexual := "false"
	if id == 12 {
		sexual = "true"
	}
	return `{"id":` + strconv.FormatInt(id, 10) + `,"name":"tag","tier":"core","kind":"content",` +
		`"sexual":` + sexual + `,"work_count":3,` +
		`"intros":[{"lang":"zh-Hans","intro":"说明","source":"vndb"}],` +
		`"works":[{"id":900,"claimed_by":` + claimJSON(7, catalogClaimStateLive) + `}],"next_offset":null}`
}

func (f *catalogFake) workDetail(path string) string {
	id, _ := strconv.ParseInt(strings.TrimPrefix(path, "/v1/catalog/works/"), 10, 64)
	gid, state := gidForCatalogID(id)
	return `{"id":` + strconv.FormatInt(id, 10) + `,"medium":"galgame","display_name":"W","olang":"ja",` +
		`"content_rating":"all_ages","release_date":"2026-07-14","created":"2026-01-01T00:00:00Z","updated":"2026-07-01T00:00:00Z",` +
		`"titles":[{"lang":"ja","title":"タイトル","kind":"official"}],` +
		`"refs":[{"source":"vndb","external_id":"v42"}],` +
		`"claimed_by":` + claimJSON(gid, state) + `,` +
		`"intro":[{"lang":"zh-Hans","intro":"介绍","source":"vndb","machine":false}],` +
		`"covers":[{"url":"https://cdn/aa/bb/hash1.webp","kind":"main","portrait_pinned":true,"sexual":0,"violence":0,"source":"vndb","width":600,"height":800,"thumbhash":"th"}],` +
		`"screenshots":[],` +
		`"tags":[{"name":"純愛","source":"vndb","canonical_id":11,"tier":"core","kind":"content","spoiler":0,"sexual":false},` +
		`{"name":"エロ","source":"vndb","canonical_id":12,"tier":"core","kind":"content","spoiler":1,"sexual":true}],` +
		`"labels":[{"id":31,"display_name":"Brand","label_kind":"game_brand","kind":"developer","lang":"ja"}],` +
		`"engines":[{"id":41,"name":"KiriKiri"}],"links":[{"source":"web","url":"https://example.test"}]}`
}

// search answers DELIBERATELY WRONG: the client sends claim_state=live, and this
// hands back a draft, a withdrawn and an unclaimed row alongside the live one,
// under a total that counts all four. A real face would not, but a client that
// re-filters the response would visibly drop three rows here and leave total
// lying about the page — which is the exact shape of doc 106 §37. Gating is the
// face's job; this lane's job is to ask for the gate and pass the answer on.
func (f *catalogFake) search() string {
	return `{"total":4,"page":1,"limit":20,"items":[` +
		workItem(900, 7, catalogClaimStateLive) + `,` +
		workItem(920, 20, catalogClaimStateDraft) + `,` +
		workItem(921, 21, catalogClaimStateHidden) + `,` +
		workItem(930, 0, "") +
		`]}`
}

// calendar returns the three renderable states plus a hidden row that must be
// dropped, and a meta frame whose max_month drives the page's empty-month jump.
func (f *catalogFake) calendar() string {
	return `{"month":"2026-07","count":4,"next_cursor":null,` +
		`"meta":{"today":"2026-07-29","min_month":"2020-01","max_month":"2026-08","has_prev":true,"has_next":true},` +
		`"items":[` +
		workItem(900, 7, catalogClaimStateLive) + `,` +
		workItem(920, 20, catalogClaimStateDraft) + `,` +
		workItem(921, 21, catalogClaimStateHidden) + `,` +
		workItem(930, 0, "") +
		`]}`
}

// workItem renders one works-list row. gid 0 / state "" means an UNCLAIMED work
// — the full-catalog population's "not on the forum yet" row.
func workItem(catalogID int64, gid int, state string) string {
	return `{"id":` + strconv.FormatInt(catalogID, 10) + `,"medium":"galgame","display_name":"W",` +
		`"content_rating":"all_ages","olang":"ja","release_date":"2026-07-14",` +
		`"claimed_by":` + claimJSON(gid, state) + `,"cover":"https://cdn/aa/bb/hash1.webp","updated":"2026-07-01T00:00:00Z",` +
		`"names":{"ja-jp":"タイトル","zh-cn":"标题"},` +
		`"covers":{"portrait":{"url":"https://cdn/aa/bb/hash1.webp","width":600,"height":800,"thumbhash":"th","sexual":0,"violence":0,"source":"vndb"},"banner":null},` +
		`"refs":[{"source":"vndb","external_id":"v42"}]}`
}

func claimJSON(gid int, state string) string {
	if gid == 0 || state == "" {
		return "null"
	}
	return `{"site":"galgame_wiki","work_id":` + strconv.Itoa(gid) + `,"state":"` + state + `"}`
}

func gidForCatalogID(id int64) (int, string) {
	for gid, fx := range gidFixture {
		if fx.catalogID == id {
			return gid, fx.state
		}
	}
	return 0, ""
}

// ─── assertions ───────────────────────────────────────────────────────────

func (f *catalogFake) reset() {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.reqs = nil
}

func (f *catalogFake) all() []fakeReq {
	f.mu.Lock()
	defer f.mu.Unlock()
	out := make([]fakeReq, len(f.reqs))
	copy(out, f.reqs)
	return out
}

func (f *catalogFake) last() fakeReq {
	reqs := f.all()
	if len(reqs) == 0 {
		return fakeReq{}
	}
	return reqs[len(reqs)-1]
}

// wantPaths asserts the EXACT sequence of paths the client dialled. The order is
// the assertion: a read that hydrates before it resolves is a read that guessed
// an id.
func (f *catalogFake) wantPaths(t *testing.T, want ...string) {
	t.Helper()
	got := make([]string, 0, len(f.all()))
	for _, r := range f.all() {
		got = append(got, r.path)
	}
	if strings.Join(got, " → ") != strings.Join(want, " → ") {
		t.Errorf("call sequence = %v, want %v", got, want)
	}
}
