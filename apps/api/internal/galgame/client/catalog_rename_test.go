package client

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

func TestAnchorBatchLookupAsksForEverySourceKey(t *testing.T) {
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
