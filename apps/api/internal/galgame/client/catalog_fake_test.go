package client

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

var gidFixture = map[int]struct {
	catalogID int64
	state     string
	limit     string
}{
	7:  {900, catalogClaimStateLive, "sfw"},
	8:  {901, catalogClaimStateLive, "sfw"},
	20: {920, catalogClaimStateDraft, "nsfw"},
	21: {921, catalogClaimStateHidden, "nsfw"},
	22: {922, catalogClaimStateLive, "sfw"},
}

func ratingForCatalogID(id int64) string {
	if id == 922 {
		return "r18"
	}
	return "all_ages"
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
	case strings.HasPrefix(p, "/v1/catalog/labels/"):
		return f.labelRecord(p)
	case strings.HasPrefix(p, "/v1/catalog/works/"):
		return f.workDetail(p)
	}
	return `{}`
}

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
			`"work":{"id":`+strconv.FormatInt(fx.catalogID, 10)+`,"medium":"galgame","display_name":"W","content_rating":"`+ratingForCatalogID(fx.catalogID)+`"},`+
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
	return `{"work":{"id":` + strconv.FormatInt(fx.catalogID, 10) + `,"medium":"galgame","display_name":"W","content_rating":"` + ratingForCatalogID(fx.catalogID) + `"},` +
		`"claimed_by":` + claimJSON(gid, fx.state) + `}`
}

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

func (f *catalogFake) tagRecord(path string) string {
	id, _ := strconv.ParseInt(strings.TrimPrefix(path, "/v1/catalog/tags/"), 10, 64)
	sexual := "false"
	if id == 12 {
		sexual = "true"
	}
	return `{"id":` + strconv.FormatInt(id, 10) + `,"name":"tag","tier":"core","kind":"content",` +
		`"sexual":` + sexual + `,"work_count":3,` +
		`"intros":[{"lang":"zh-Hans","intro":"说明","source":"vndb"}]}`
}

func (f *catalogFake) labelRecord(path string) string {
	id, _ := strconv.ParseInt(strings.TrimPrefix(path, "/v1/catalog/labels/"), 10, 64)
	return `{"id":` + strconv.FormatInt(id, 10) + `,"display_name":"Brand","kind":"developer","lang":"ja",` +
		`"aliases":[{"value":"ブランド","lang":"ja","kind":"spelling_variant"},` +
		`{"value":"Brand","kind":"spelling_variant","machine":true}],` +
		`"work_count":3,"logo_hash":"abcd1234",` +
		`"intros":[{"lang":"zh-Hans","intro":"说明","source":"vndb"}],` +
		`"links":[{"source":"web","url":"https://example.test"}]}`
}

func (f *catalogFake) workDetail(path string) string {
	id, _ := strconv.ParseInt(strings.TrimPrefix(path, "/v1/catalog/works/"), 10, 64)
	gid, state := gidForCatalogID(id)
	return `{"id":` + strconv.FormatInt(id, 10) + `,"medium":"galgame","display_name":"W","olang":"ja",` +
		`"content_rating":"` + ratingForCatalogID(id) + `","release_date":"2026-07-14","created":"2026-01-01T00:00:00Z","updated":"2026-07-01T00:00:00Z",` +
		`"localized":{"ja":{"value":"タイトル","kind":"official"},` +
		`"zh":{"value":"机翻标题","kind":"official","machine":true},` +
		`"zh-Hans":{"value":"标题","kind":"official"},` +
		`"en":{"value":"Title","kind":"official"}},` +
		`"refs":[{"source":"vndb","external_id":"v42"}],` +
		`"claimed_by":` + claimJSON(gid, state) + `,` +
		`"intros":[{"lang":"zh-Hans","intro":"介绍","source":"vndb","machine":false}],` +
		`"covers":[{"url":"https://cdn/aa/bb/hash1.webp","kind":"main","portrait_pinned":true,"sexual":0,"violence":0,"source":"vndb","width":600,"height":800,"thumbhash":"th"},` +
		`{"url":"https://cdn/aa/bb/hash2.webp","kind":"main","portrait_pinned":false,"sexual":0,"violence":0,"source":"vndb","width":1280,"height":720,"thumbhash":"th2"}],` +
		`"screenshots":[],` +
		`"tags":[{"name":"純愛","source":"vndb","canonical_id":11,"tier":"core","kind":"content","spoiler":0,"sexual":false},` +
		`{"name":"エロ","source":"vndb","canonical_id":12,"tier":"core","kind":"content","spoiler":1,"sexual":true}],` +
		`"labels":[{"id":31,"display_name":"Brand","label_kind":"game_brand","kind":"developer","lang":"ja","logo_hash":"abcd1234"}],` +
		`"engines":[{"id":41,"name":"KiriKiri"}],"links":[{"source":"web","url":"https://example.test"}]}`
}

func (f *catalogFake) search() string {
	return `{"total":4,"page":1,"limit":20,"items":[` +
		workItem(900, 7, catalogClaimStateLive) + `,` +
		workItem(920, 20, catalogClaimStateDraft) + `,` +
		workItem(921, 21, catalogClaimStateHidden) + `,` +
		workItem(930, 0, "") +
		`]}`
}

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

func workItem(catalogID int64, gid int, state string) string {
	return `{"id":` + strconv.FormatInt(catalogID, 10) + `,"medium":"galgame","display_name":"W",` +
		`"content_rating":"` + ratingForCatalogID(catalogID) + `","olang":"ja","release_date":"2026-07-14",` +
		`"claimed_by":` + claimJSON(gid, state) + `,"cover":"https://cdn/aa/bb/hash1.webp","updated":"2026-07-01T00:00:00Z",` +
		`"localized":{"ja":{"value":"タイトル","kind":"official"},` +
		`"zh-Hans":{"value":"标题","kind":"official"},` +
		`"zh-Hant":{"value":"標題","kind":"official"},` +
		`"en":{"value":"Title","kind":"official","machine":true},` +
		`"ko":{"value":"타이틀","kind":"official"}},` +
		`"covers":{"portrait":{"url":"https://cdn/aa/bb/hash1.webp","width":600,"height":800,"thumbhash":"th","sexual":0,"violence":0,"source":"vndb"},` +
		`"banner":{"url":"https://cdn/aa/bb/hash2.webp","width":1280,"height":720,"thumbhash":"th2","sexual":0,"violence":0,"source":"vndb"}},` +
		`"refs":[{"source":"vndb","external_id":"v42"}]}`
}

func claimJSON(gid int, state string) string {
	if gid == 0 || state == "" {
		return "null"
	}
	return `{"site":"galgame_wiki","work_id":` + strconv.Itoa(gid) + `,"state":"` + state + `",` +
		`"content_limit":"` + gidFixture[gid].limit + `"}`
}

func gidForCatalogID(id int64) (int, string) {
	for gid, fx := range gidFixture {
		if fx.catalogID == id {
			return gid, fx.state
		}
	}
	return 0, ""
}

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
