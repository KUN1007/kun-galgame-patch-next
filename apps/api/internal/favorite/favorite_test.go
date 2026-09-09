package favorite

import (
	"context"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	galgameClient "kun-galgame-patch-api/internal/galgame/client"
)

type face struct {
	mu    sync.Mutex
	paths []string
	body  map[string]string
}

func (f *face) serve(t *testing.T) *galgameClient.Client {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		f.mu.Lock()
		f.paths = append(f.paths, r.URL.Path)
		f.mu.Unlock()
		body, ok := f.body[r.URL.Path]
		if !ok {
			w.WriteHeader(http.StatusNotFound)
			_, _ = w.Write([]byte(`{"code":"NOT_FOUND","status":404,"detail":"no"}`))
			return
		}
		_, _ = w.Write([]byte(body))
	}))
	t.Cleanup(srv.Close)
	return galgameClient.NewWithKey(srv.URL, "nmk_test_key")
}

func (f *face) seen(path string) bool {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, p := range f.paths {
		if p == path {
			return true
		}
	}
	return false
}

const twoFolders = `{"object":"list","items":[
	{"id":"11","owner_uid":"7","name":"","visibility":"private","is_default":true,"item_count":2},
	{"id":"12","owner_uid":"7","name":"b","visibility":"public","is_default":false,"item_count":1}
],"next_cursor":null}`

// A work filed in two folders is one favourite, and the private folder is part
// of the answer only for its owner. Reading a shelf without the owner's token
// is how the 收藏 tab came to show nothing over ten favourites.
func TestWorkIDsOwnerSeesPrivateFoldersAndDedupes(t *testing.T) {
	f := &face{body: map[string]string{
		"/v2/me/folders": twoFolders,
		"/v2/me/folders/11/items": `{"object":"list","items":[
			{"folder_id":"11","work_id":"285","created_at":"2026-09-03T00:00:00Z"},
			{"folder_id":"11","work_id":"898","created_at":"2026-09-03T00:01:00Z"}
		],"next_cursor":null}`,
		"/v2/me/folders/12/items": `{"object":"list","items":[
			{"folder_id":"12","work_id":"285","created_at":"2026-09-04T00:00:00Z"}
		],"next_cursor":null}`,
	}}
	got, err := WorkIDs(context.Background(), f.serve(t), 7, "tok", true)
	if err != nil {
		t.Fatalf("WorkIDs: %v", err)
	}
	if len(got) != 2 || got[0] != 285 || got[1] != 898 {
		t.Fatalf("want [285 898], got %v", got)
	}
}

func TestWorkIDsVisitorSeesOnlyPublicFolders(t *testing.T) {
	f := &face{body: map[string]string{
		"/v2/folders": `{"object":"list","items":[
			{"id":"12","owner_uid":"7","name":"b","visibility":"public","is_default":false,"item_count":1}
		],"next_cursor":null}`,
		"/v2/folders/12/items": `{"object":"list","items":[
			{"folder_id":"12","work_id":"285","created_at":"2026-09-04T00:00:00Z"}
		],"next_cursor":null}`,
	}}
	gal := f.serve(t)
	got, err := WorkIDs(context.Background(), gal, 7, "tok", false)
	if err != nil {
		t.Fatalf("WorkIDs: %v", err)
	}
	if len(got) != 1 || got[0] != 285 {
		t.Fatalf("want [285], got %v", got)
	}
	if f.seen("/v2/me/folders") {
		t.Fatal("a visitor must not be answered off the owner's own face")
	}
}

// An empty folder is not worth a request.
func TestWorkIDsSkipsEmptyFolders(t *testing.T) {
	f := &face{body: map[string]string{
		"/v2/me/folders": `{"object":"list","items":[
			{"id":"11","owner_uid":"7","name":"","visibility":"private","is_default":true,"item_count":0}
		],"next_cursor":null}`,
	}}
	gal := f.serve(t)
	got, err := WorkIDs(context.Background(), gal, 7, "tok", true)
	if err != nil {
		t.Fatalf("WorkIDs: %v", err)
	}
	if len(got) != 0 {
		t.Fatalf("want none, got %v", got)
	}
	if f.seen("/v2/me/folders/11/items") {
		t.Fatal("an item_count of 0 should not cost a request")
	}
}

func TestHoldsAsksOneQuestion(t *testing.T) {
	f := &face{body: map[string]string{
		"/v2/me/folders": `{"object":"list","items":[
			{"id":"11","owner_uid":"7","name":"","visibility":"private","is_default":true,"item_count":2}
		],"next_cursor":null}`,
	}}
	gal := f.serve(t)
	held, err := Holds(context.Background(), gal, "tok", 285)
	if err != nil {
		t.Fatalf("Holds: %v", err)
	}
	if !held {
		t.Fatal("want held")
	}
	if f.seen("/v2/me/folders/11/items") {
		t.Fatal("Holds must not walk the folders it was handed")
	}
}

func TestHoldsWithoutTokenIsFalse(t *testing.T) {
	f := &face{body: map[string]string{}}
	held, err := Holds(context.Background(), f.serve(t), "", 285)
	if err != nil || held {
		t.Fatalf("want false/nil, got %v/%v", held, err)
	}
}
