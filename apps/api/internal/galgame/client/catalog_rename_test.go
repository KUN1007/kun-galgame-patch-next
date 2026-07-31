package client

// Two identity keys move during the W1 window and moyu READS both of them:
//
//   - the source key that anchors gid lookups (galgame_wiki -> curated), and
//   - the claim site on claimed_by (galgame_wiki -> kungal).
//
// They are written elsewhere, in two DIFFERENT deploy steps, and both fail
// SILENTLY when reader and data disagree: an unmatched source resolves no gid
// at all (every galgame page 404s), and an unmatched site yields gid 0, which
// strips a card's link and mis-attaches its local stats without raising
// anything.
//
// So the reader accepts both spellings instead of being flipped in lockstep
// with the data. These tests pin that tolerance in both directions; when the
// legacy halves are removed after the flip has soaked, they are what should
// fail first.

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"slices"
	"strings"
	"testing"
)

func TestClaimSiteAcceptedOnBothSpellings(t *testing.T) {
	cases := []struct {
		site string
		want int
	}{
		{"kungal", 4321},
		{"galgame_wiki", 4321},
		{"moyu", 0},
		{"", 0},
	}
	for _, tc := range cases {
		t.Run(tc.site, func(t *testing.T) {
			c := &catalogClaimedBy{Site: tc.site, WorkID: 4321, State: catalogClaimStateLive}
			if got := c.gid(); got != tc.want {
				t.Errorf("gid() on site %q = %d, want %d", tc.site, got, tc.want)
			}
			// live() carries the same site test, and it is the ban/publish gate
			// on every batch and detail read — a site it does not recognise
			// reads as "not published".
			if got := c.live(); got != (tc.want != 0) {
				t.Errorf("live() on site %q = %v, want %v", tc.site, got, tc.want != 0)
			}
			if got := claimStateOf(c); (got == catalogClaimStateLive) != (tc.want != 0) {
				t.Errorf("claimStateOf on site %q = %q", tc.site, got)
			}
		})
	}
	if (&catalogClaimedBy{}).gid() != 0 {
		t.Error("an unclaimed row has no gid")
	}
}

// The batch lookup must ask for every source key in flight, so it resolves on
// either side of the rename without a coordinated deploy.
func TestAnchorBatchLookupAsksForEverySourceKey(t *testing.T) {
	// Only the LEGACY key answers here, i.e. the state before the infra rename.
	var asked []string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		var body catalogLookupBatchRequest
		_ = json.NewDecoder(req.Body).Decode(&body)
		out := make([]string, 0, len(body.Items))
		for _, it := range body.Items {
			asked = append(asked, it.Source)
			work := "null"
			if it.Source == "galgame_wiki" && it.ExternalID == "7" {
				work = `{"id":9001}`
			}
			out = append(out, `{"source":"`+it.Source+`","external_id":"`+it.ExternalID+
				`","work":`+work+`,"claimed_by":null}`)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"code":0,"message":"ok","data":{"items":[` +
			strings.Join(out, ",") + `]}}`))
	}))
	t.Cleanup(srv.Close)

	c := NewWithKey(srv.URL, "nm_test_key")
	ids, err := c.resolveGIDs(t.Context(), []int{7})
	if err != nil {
		t.Fatalf("resolveGIDs: %v", err)
	}
	if ids[7] != 9001 {
		t.Errorf("gid 7 resolved to %d, want 9001 via the pre-rename source key", ids[7])
	}
	for _, key := range anchorSourceKeys {
		if !slices.Contains(asked, key) {
			t.Errorf("source key %q was never asked for; the lookup only resolves "+
				"on the side of the rename it happens to name", key)
		}
	}
}

// And the post-rename side resolves too, from a cold cache.
func TestAnchorBatchLookupResolvesAfterTheRename(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		var body catalogLookupBatchRequest
		_ = json.NewDecoder(req.Body).Decode(&body)
		out := make([]string, 0, len(body.Items))
		for _, it := range body.Items {
			work := "null"
			if it.Source == "curated" && it.ExternalID == "8" {
				work = `{"id":9002}`
			}
			out = append(out, `{"source":"`+it.Source+`","external_id":"`+it.ExternalID+
				`","work":`+work+`,"claimed_by":null}`)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"code":0,"message":"ok","data":{"items":[` +
			strings.Join(out, ",") + `]}}`))
	}))
	t.Cleanup(srv.Close)

	c := NewWithKey(srv.URL, "nm_test_key")
	ids, err := c.resolveGIDs(t.Context(), []int{8})
	if err != nil {
		t.Fatalf("resolveGIDs: %v", err)
	}
	if ids[8] != 9002 {
		t.Errorf("gid 8 resolved to %d, want 9002 via the post-rename source key", ids[8])
	}
}

// A batch page must never exceed the wire's item ceiling. One gid now costs one
// item per source key, so the gid stride has to shrink with the key count —
// otherwise the extra spelling pushes the page past the limit and the catalog
// answers 400 for the whole chunk.
func TestAnchorBatchLookupRespectsTheItemCeiling(t *testing.T) {
	maxItems := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		var body catalogLookupBatchRequest
		_ = json.NewDecoder(req.Body).Decode(&body)
		if n := len(body.Items); n > maxItems {
			maxItems = n
		}
		out := make([]string, 0, len(body.Items))
		for _, it := range body.Items {
			out = append(out, `{"source":"`+it.Source+`","external_id":"`+it.ExternalID+
				`","work":null,"claimed_by":null}`)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"code":0,"message":"ok","data":{"items":[` +
			strings.Join(out, ",") + `]}}`))
	}))
	t.Cleanup(srv.Close)

	gids := make([]int, 0, 250)
	for i := 1; i <= 250; i++ {
		gids = append(gids, i)
	}
	c := NewWithKey(srv.URL, "nm_test_key")
	if _, err := c.resolveGIDs(t.Context(), gids); err != nil {
		t.Fatalf("resolveGIDs: %v", err)
	}
	if maxItems > catalogLookupBatchMax {
		t.Errorf("a page carried %d items, over the %d ceiling", maxItems, catalogLookupBatchMax)
	}
	if maxItems == 0 {
		t.Fatal("the face was never called")
	}
}

// The singular lookups take ONE source, so they walk the keys instead. Both the
// work bridge and the label bridge must find a row filed under either spelling.
func TestSingularLookupsWalkEverySourceKey(t *testing.T) {
	for _, answering := range anchorSourceKeys {
		t.Run(answering, func(t *testing.T) {
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				if req.URL.Query().Get("source") != answering {
					w.WriteHeader(http.StatusNotFound)
					_, _ = w.Write([]byte(bodyDocumented404))
					return
				}
				if req.URL.Query().Get("type") == "label" {
					_, _ = w.Write([]byte(`{"code":0,"message":"ok","data":{"label":{"id":77}}}`))
					return
				}
				_, _ = w.Write([]byte(`{"code":0,"message":"ok","data":{"work":{"id":88},"claimed_by":null}}`))
			}))
			t.Cleanup(srv.Close)

			c := NewWithKey(srv.URL, "nm_test_key")
			id, found, err := c.resolveGID(t.Context(), 5)
			if err != nil || !found || id != 88 {
				t.Errorf("resolveGID = (%d, %v, %v), want (88, true, nil)", id, found, err)
			}
			labelID, found, err := c.ResolveWikiLabel(t.Context(), 6)
			if err != nil || !found || labelID != 77 {
				t.Errorf("ResolveWikiLabel = (%d, %v, %v), want (77, true, nil)", labelID, found, err)
			}
		})
	}
}
