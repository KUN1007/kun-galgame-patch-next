package client

import (
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
}

func TestPublicGID_UnclaimedUsesCatalogID(t *testing.T) {
	unclaimed := &catalogWorkListItem{ID: 930}
	if got := unclaimed.publicGID(); got != 930 {
		t.Errorf("unclaimed publicGID = %d, want the catalog id 930", got)
	}
	claimed := &catalogWorkListItem{
		ID:        900,
		ClaimedBy: &catalogClaimedBy{Site: catalogClaimSiteLegacy, WorkID: 7, State: catalogClaimStateLive},
	}
	if got := claimed.publicGID(); got != 7 {
		t.Errorf("claimed publicGID = %d, want the wiki gid 7", got)
	}
	hidden := &catalogWorkListItem{
		ID:        921,
		ClaimedBy: &catalogClaimedBy{Site: catalogClaimSiteLegacy, WorkID: 21, State: catalogClaimStateHidden},
	}
	if hidden.ClaimedBy.renderable() {
		t.Error("a hidden claim must not be renderable")
	}
}

func TestAnchorBatchLookupAsksForEverySourceKey(t *testing.T) {
	var asked []string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		asked = append(asked, req.URL.Query().Get("refs"))
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(v2List(
			`{"object":"work","id":"9001","refs":[{"source":"galgame_wiki","external_id":"7"},{"source":"curated","external_id":"7"}]}`,
		)))
	}))
	t.Cleanup(srv.Close)

	c := NewWithKey(srv.URL, "nm_test_key")
	ids, err := c.resolveGIDs(t.Context(), []int{7})
	if err != nil {
		t.Fatalf("resolveGIDs: %v", err)
	}
	if ids[7] != 9001 {
		t.Errorf("gid 7 resolved to %d, want 9001", ids[7])
	}
	joined := strings.Join(asked, ",")
	for _, key := range anchorSourceKeys {
		if !strings.Contains(joined, key+":7") {
			t.Errorf("source key %q was never asked for; refs=%q", key, joined)
		}
	}
}

func TestAnchorBatchLookupResolvesAfterTheRename(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(v2List(
			`{"object":"work","id":"9002","refs":[{"source":"curated","external_id":"8"}]}`,
		)))
	}))
	t.Cleanup(srv.Close)

	c := NewWithKey(srv.URL, "nm_test_key")
	ids, err := c.resolveGIDs(t.Context(), []int{8})
	if err != nil {
		t.Fatalf("resolveGIDs: %v", err)
	}
	if ids[8] != 9002 {
		t.Errorf("gid 8 resolved to %d, want 9002", ids[8])
	}
}

func TestAnchorBatchLookupRespectsTheItemCeiling(t *testing.T) {
	maxRefs := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		n := 0
		if raw := req.URL.Query().Get("refs"); raw != "" {
			n = len(strings.Split(raw, ","))
		}
		if n > maxRefs {
			maxRefs = n
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(v2List("")))
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
	if maxRefs > catalogLookupBatchMax {
		t.Errorf("a page carried %d refs, over the %d ceiling", maxRefs, catalogLookupBatchMax)
	}
	if maxRefs == 0 {
		t.Fatal("the face was never called")
	}
}

func TestSingularLookupsWalkEverySourceKey(t *testing.T) {
	for _, answering := range anchorSourceKeys {
		t.Run(answering, func(t *testing.T) {
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				refs := req.URL.Query().Get("refs")
				if !strings.HasPrefix(refs, answering+":") {
					_, _ = w.Write([]byte(v2List("")))
					return
				}
				if strings.Contains(req.URL.Path, "/companies") {
					_, _ = w.Write([]byte(v2List(`{"id":"77"}`)))
					return
				}
				_, _ = w.Write([]byte(v2List(`{"object":"work","id":"88","refs":[{"source":"` + answering + `","external_id":"5"}]}`)))
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

func TestSourceKeysStayDistinct(t *testing.T) {
	if slices.Equal(anchorSourceKeys, []string{}) {
		t.Fatal("anchor source keys must stay populated")
	}
}
