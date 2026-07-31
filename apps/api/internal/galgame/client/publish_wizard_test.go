package client

// The publish wizard is moyu's only defence against a user minting a duplicate
// entry in the shared registry, so both of its halves are pinned here.
//
// The ITEMS half must reach the catalog search with claim_state=live,draft.
// Narrowing it to `live` hides every unpublished draft, which is exactly the
// 2026-07-24 failure: 52k of 63k entries invisible, users hitting 提交新作 and
// creating blank duplicates of drafts that already existed.
//
// The PENDING half must stay on the wiki face and must keep the wiki `status`
// int, which is the only thing that tells 审核中 from 已拒绝.

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
	wikiQ    url.Values
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
			r.wikiQ = req.URL.Query()
			r.wikiHits++
			body = `{"code":0,"message":"ok","data":{"items":[{"id":1}],"total":1,
			  "pending":[{"id":64689,"status":3,"vndb_id":"","name_ja_jp":"曇った瞳に恋してる"},
			             {"id":61301,"status":4,"vndb_id":"","name_ja_jp":"ピエタ"}]}}`
		}
		r.mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(body))
	}))
	t.Cleanup(srv.Close)
	return NewWithKey(srv.URL, "nm_test_key")
}

func (r *wizardRecorder) search(t *testing.T) *SearchPending {
	t.Helper()
	out, err := r.client(t).SearchGalgameForPublish(context.Background(), "user-jwt", "sakura", 12)
	if err != nil {
		t.Fatalf("SearchGalgameForPublish: %v", err)
	}
	return out
}

func TestPublishWizard_ItemsComeFromTheCatalog(t *testing.T) {
	rec := &wizardRecorder{}
	out := rec.search(t)

	if got := rec.catalogQ.Get("claim_state"); got != "live,draft" {
		t.Errorf("claim_state = %q, want live,draft — `live` alone hides every claimable draft", got)
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
	// The age gate is unconditional and the EDITING gate is absent: the wizard
	// is a dedup tool for a submitter, not a browse surface.
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
	// Never the catalog id: both wizard actions (POST /patch {galgame_id} and
	// POST /galgame/:gid/claim) are keyed by the wiki gid.
	if out.Items[0].ID != 292 || out.Items[1].ID != 9978 {
		t.Errorf("ids = %d,%d, want the gids 292,9978", out.Items[0].ID, out.Items[1].ID)
	}
	// claim_state is what the wizard branches on now — `draft` is the 认领 CTA.
	if out.Items[0].ClaimState != "live" || out.Items[1].ClaimState != "draft" {
		t.Errorf("claim states = %q,%q, want live,draft",
			out.Items[0].ClaimState, out.Items[1].ClaimState)
	}
	if out.Items[0].VndbID != "v22610" {
		t.Errorf("vndb_id = %q, want v22610", out.Items[0].VndbID)
	}
}

func TestPublishWizard_PendingStaysOnTheWikiFaceAndKeepsStatus(t *testing.T) {
	rec := &wizardRecorder{}
	out := rec.search(t)

	if rec.wikiHits != 1 {
		t.Fatalf("wiki face hits = %d, want exactly 1", rec.wikiHits)
	}
	if got := rec.wikiQ.Get("include_pending"); got != "true" {
		t.Errorf("include_pending = %q, want true", got)
	}
	if got := rec.wikiQ.Get("status"); got != "0,2" {
		t.Errorf("status = %q, want the pre-switchover 0,2 verbatim", got)
	}
	if len(out.Pending) != 2 {
		t.Fatalf("pending = %d, want 2", len(out.Pending))
	}
	// Decoding this half into GalgameHit dropped `status`, which is the ONLY
	// signal separating 审核中 from 已拒绝 on screen.
	if out.Pending[0].Status != 3 || out.Pending[1].Status != 4 {
		t.Errorf("pending statuses = %d,%d, want 3,4",
			out.Pending[0].Status, out.Pending[1].Status)
	}
	if out.Pending[0].ID != 64689 || out.Pending[0].NameJaJp != "曇った瞳に恋してる" {
		t.Errorf("pending[0] = %+v, want the caller's own row forwarded", out.Pending[0])
	}
}

func TestPublishWizard_EmptyHalvesAreArraysNotNull(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"code":0,"message":"ok","data":{}}`))
	}))
	t.Cleanup(srv.Close)

	out, err := NewWithKey(srv.URL, "nm_test_key").
		SearchGalgameForPublish(context.Background(), "user-jwt", "nothing", 12)
	if err != nil {
		t.Fatalf("SearchGalgameForPublish: %v", err)
	}
	// `null` breaks the page's `results.items.length` reads.
	if out.Items == nil || out.Pending == nil {
		t.Errorf("items=%v pending=%v, want empty slices", out.Items, out.Pending)
	}
}
