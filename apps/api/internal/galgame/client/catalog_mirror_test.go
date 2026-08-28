package client

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
)

func mirrorServer(t *testing.T, body string, seen *url.Values) *Client {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		*seen = r.URL.Query()
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(body))
	}))
	t.Cleanup(srv.Close)
	return NewWithKey(srv.URL, "nmk_test_key")
}

func verdictOf(rows []DisplayVerdict, gid int) (string, bool) {
	for _, r := range rows {
		if r.GID == gid {
			return r.ContentLimit, true
		}
	}
	return "", false
}

func TestDisplayVerdictsOpenBothGates(t *testing.T) {
	var q url.Values
	c := mirrorServer(t, `{"object":"list","items":[]}`, &q)
	if _, err := c.DisplayVerdictsByCatalogIDs(context.Background(), []int64{1, 2}); err != nil {
		t.Fatalf("DisplayVerdictsByCatalogIDs: %v", err)
	}
	if q.Get("nsfw") != "true" {
		t.Errorf("nsfw = %q, want true — the reader's gate would hide the works this is meant to mark nsfw", q.Get("nsfw"))
	}
	if got, ok := q["content_limit"]; ok {
		t.Errorf("content_limit = %v, want it absent", got)
	}
	if q.Get("include") != "refs" {
		t.Errorf("include = %q, want refs — the anchor lives there", q.Get("include"))
	}
	if q.Get("ids") != "1,2" {
		t.Errorf("ids = %q, want 1,2", q.Get("ids"))
	}
}

func TestDisplayVerdictKeysOnTheAnchorNotTheCatalogID(t *testing.T) {
	var q url.Values
	c := mirrorServer(t, `{"object":"list","items":[
		{"object":"work","id":"501","content_rating":"all",
		 "claim":{"site":"kungal","site_work_id":"7001","state":"live","content_limit":"nsfw"},
		 "refs":[{"source":"curated","external_id":"7001"}]},
		{"object":"work","id":"502","content_rating":"r18",
		 "refs":[{"source":"galgame_wiki","external_id":"7002"}]},
		{"object":"work","id":"503","content_rating":"r18","refs":[{"source":"vndb","external_id":"v503"}]},
		{"object":"work","id":"504","content_rating":"all",
		 "claim":{"site":"letmoe","site_work_id":"88","state":"live","content_limit":"sfw"},
		 "refs":[{"source":"curated","external_id":"7004"}]}
	]}`, &q)

	rows, err := c.DisplayVerdictsByCatalogIDs(context.Background(), []int64{501, 502, 503, 504})
	if err != nil {
		t.Fatalf("DisplayVerdictsByCatalogIDs: %v", err)
	}

	t.Run("the claim's site_work_id wins over the catalog id", func(t *testing.T) {
		if cl, ok := verdictOf(rows, 7001); !ok || cl != "nsfw" {
			t.Errorf("gid 7001 = %q/%v, want nsfw — claimed_by.content_limit beats content_rating", cl, ok)
		}
		if _, ok := verdictOf(rows, 501); ok {
			t.Error("catalog id 501 was filed as a gid; it names a different game in the patch table")
		}
	})

	t.Run("an unclaimed work falls back to its anchor ref", func(t *testing.T) {
		if cl, ok := verdictOf(rows, 7002); !ok || cl != "nsfw" {
			t.Errorf("gid 7002 = %q/%v, want nsfw from content_rating r18", cl, ok)
		}
	})

	t.Run("a work with neither anchor is skipped rather than keyed on its catalog id", func(t *testing.T) {
		if _, ok := verdictOf(rows, 503); ok {
			t.Error("catalog id 503 was filed as a gid despite carrying no moyu anchor")
		}
	})

	t.Run("another product's claim does not name a moyu row", func(t *testing.T) {
		if cl, ok := verdictOf(rows, 7004); !ok || cl != "sfw" {
			t.Errorf("gid 7004 = %q/%v, want sfw from the ref anchor and content_rating", cl, ok)
		}
		if _, ok := verdictOf(rows, 88); ok {
			t.Error("letmoe's site_work_id 88 was read as a moyu gid")
		}
	})
}

func TestDisplayVerdictsRefuseAnOversizedBatch(t *testing.T) {
	var q url.Values
	c := mirrorServer(t, `{"object":"list","items":[]}`, &q)
	ids := make([]int64, CatalogWorksIDsMax+1)
	for i := range ids {
		ids[i] = int64(i + 1)
	}
	if _, err := c.DisplayVerdictsByCatalogIDs(context.Background(), ids); err == nil {
		t.Fatal("want an error above the id ceiling, got nil")
	}
}
