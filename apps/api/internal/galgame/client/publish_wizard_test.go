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

type wizardRecorder struct {
	mu       sync.Mutex
	catalogQ url.Values
	wikiHits int
}

func (r *wizardRecorder) client(t *testing.T) *Client {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		r.mu.Lock()
		body := `{"code":0,"message":"ok","data":{}}`
		switch {
		case strings.HasSuffix(req.URL.Path, "/catalog/works/search"):
			r.catalogQ = req.URL.Query()
			body = `{"code":0,"message":"ok","data":{"total":2,"items":[
			  {"id":11,"display_name":"A","content_rating":"r18",
			   "claimed_by":{"site":"galgame_wiki","work_id":292,"state":"live","content_limit":"nsfw"},
			   "names":{"ja-jp":"白恋サクラ"},"refs":[{"source":"vndb","external_id":"v22610"}]},
			  {"id":12,"display_name":"B","content_rating":"r18",
			   "claimed_by":{"site":"galgame_wiki","work_id":9978,"state":"draft","content_limit":"nsfw"}},
			  {"id":13,"display_name":"withdrawn","content_rating":"r18",
			   "claimed_by":{"site":"galgame_wiki","work_id":404,"state":"hidden","content_limit":"nsfw"}},
			  {"id":14,"display_name":"unclaimed","content_rating":"r18","claimed_by":null}
			]}}`
		case strings.HasSuffix(req.URL.Path, "/galgame/search"):
			r.wikiHits++
		}
		r.mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(body))
	}))
	t.Cleanup(srv.Close)
	return NewWithKey(srv.URL, "nm_test_key")
}

type wizardItems struct {
	Items []GalgameHit
	Total int64
}

func (r *wizardRecorder) search(t *testing.T) wizardItems {
	t.Helper()
	items, total, err := r.client(t).SearchPublishItems(context.Background(), "sakura", 12)
	if err != nil {
		t.Fatalf("SearchPublishItems: %v", err)
	}
	return wizardItems{Items: items, Total: total}
}

func TestPublishWizard_ItemsComeFromTheCatalog(t *testing.T) {
	rec := &wizardRecorder{}
	out := rec.search(t)

	if got := rec.catalogQ.Get("claim_state"); got != "live,draft,pending" {
		t.Errorf("claim_state = %q, want live,draft,pending — `live` alone hides every "+
			"claimable draft, and dropping `pending` would hide every entry already "+
			"under review the moment the registry starts telling them apart", got)
	}
	if got := rec.catalogQ.Get("claimed"); got != "true" {
		t.Errorf("claimed = %q, want true — an unclaimed row has no gid to act on", got)
	}
	if got := rec.catalogQ.Get("q"); got != "sakura" {
		t.Errorf("q = %q, want sakura", got)
	}
	if got := rec.catalogQ.Get("limit"); got != "12" {
		t.Errorf("limit = %q, want 12", got)
	}
	if got := rec.catalogQ.Get("nsfw"); got != "1" {
		t.Errorf("nsfw = %q, want 1", got)
	}
	if got := rec.catalogQ.Get("content_limit"); got != "" {
		t.Errorf("content_limit = %q, want it absent on the wizard lane", got)
	}
	if !strings.Contains(rec.catalogQ.Get("include"), "refs") {
		t.Errorf("include = %q, want refs (the row prints the VNDB id)", rec.catalogQ.Get("include"))
	}
	if out.Total != 2 {
		t.Errorf("total = %d, want the catalog total 2", out.Total)
	}
}

func TestPublishWizard_ItemsAreGidKeyedAndDropWithdrawnRows(t *testing.T) {
	rec := &wizardRecorder{}
	out := rec.search(t)

	if len(out.Items) != 2 {
		t.Fatalf("items = %d, want 2 (a hidden claim and an unclaimed row are not actionable)", len(out.Items))
	}
	if out.Items[0].ID != 292 || out.Items[1].ID != 9978 {
		t.Errorf("ids = %d,%d, want the gids 292,9978", out.Items[0].ID, out.Items[1].ID)
	}
	if out.Items[0].ClaimState != "live" || out.Items[1].ClaimState != "draft" {
		t.Errorf("claim states = %q,%q, want live,draft",
			out.Items[0].ClaimState, out.Items[1].ClaimState)
	}
	if out.Items[0].VndbID != "v22610" {
		t.Errorf("vndb_id = %q, want v22610", out.Items[0].VndbID)
	}
}

func TestPublishWizard_NeverTouchesTheWikiFace(t *testing.T) {
	rec := &wizardRecorder{}
	rec.search(t)

	if rec.wikiHits != 0 {
		t.Errorf("wiki face hits = %d, want 0 — the caller's own submissions come "+
			"from the registry's per-user claim face now, composed in by the BFF", rec.wikiHits)
	}
}

func TestPublishWizard_EmptyResultIsAnArrayNotNull(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"code":0,"message":"ok","data":{}}`))
	}))
	t.Cleanup(srv.Close)

	items, _, err := NewWithKey(srv.URL, "nm_test_key").
		SearchPublishItems(context.Background(), "nothing", 12)
	if err != nil {
		t.Fatalf("SearchPublishItems: %v", err)
	}
	if items == nil {
		t.Error("items = nil, want an empty slice")
	}
}
