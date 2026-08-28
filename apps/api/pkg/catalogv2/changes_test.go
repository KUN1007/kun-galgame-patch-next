package catalogv2

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
)

func changesServer(t *testing.T, body string, seen *url.Values) *Client {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		*seen = r.URL.Query()
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(body))
	}))
	t.Cleanup(srv.Close)
	return New(srv.URL, "nmk_test_key")
}

func TestChangesReadsTheMirrorChannel(t *testing.T) {
	ctx := context.Background()

	t.Run("gone is absent, not false, on a live id", func(t *testing.T) {
		var q url.Values
		c := changesServer(t, `{"object":"list","items":[
			{"object":"change","target_object":"work","id":"7","updated_at":"2026-08-01T00:00:00Z"},
			{"object":"change","target_object":"work","id":"9","updated_at":"2026-08-01T00:00:01Z","gone":true}
		],"next_cursor":"cur_next"}`, &q)
		page, err := c.Changes(ctx, "", 100)
		if err != nil {
			t.Fatalf("Changes: %v", err)
		}
		if len(page.Items) != 2 {
			t.Fatalf("items = %d, want 2", len(page.Items))
		}
		if page.Items[0].ID != 7 || page.Items[0].Gone {
			t.Errorf("live entry = %+v, want id 7 and gone false", page.Items[0])
		}
		if page.Items[1].ID != 9 || !page.Items[1].Gone {
			t.Errorf("gone entry = %+v, want id 9 and gone true", page.Items[1])
		}
		if page.NextCursor != "cur_next" {
			t.Errorf("next_cursor = %q, want cur_next", page.NextCursor)
		}
	})

	t.Run("a non-work family is dropped, not read as a work id", func(t *testing.T) {
		var q url.Values
		c := changesServer(t, `{"object":"list","items":[
			{"object":"change","target_object":"person","id":"7","updated_at":"2026-08-01T00:00:00Z"},
			{"object":"change","target_object":"work","id":"8","updated_at":"2026-08-01T00:00:01Z"}
		],"next_cursor":null}`, &q)
		page, err := c.Changes(ctx, "", 100)
		if err != nil {
			t.Fatalf("Changes: %v", err)
		}
		if len(page.Items) != 1 || page.Items[0].ID != 8 {
			t.Fatalf("items = %+v, want only work 8", page.Items)
		}
		if page.NextCursor != "" {
			t.Errorf("next_cursor = %q, want empty on a short page", page.NextCursor)
		}
	})

	t.Run("an empty cursor is omitted and the limit stays under the ceiling", func(t *testing.T) {
		var q url.Values
		c := changesServer(t, `{"object":"list","items":[]}`, &q)
		if _, err := c.Changes(ctx, "", 0); err != nil {
			t.Fatalf("Changes: %v", err)
		}
		if _, ok := q["cursor"]; ok {
			t.Errorf("cursor = %q, want it absent on the bootstrap read", q.Get("cursor"))
		}
		if q.Get("limit") != "100" {
			t.Errorf("limit = %q, want 100", q.Get("limit"))
		}
		// Above the ceiling the call is 400 LIMIT_TOO_LARGE, not clamped.
		if _, err := c.Changes(ctx, "cur_abc", 500); err != nil {
			t.Fatalf("Changes: %v", err)
		}
		if q.Get("limit") != "100" {
			t.Errorf("limit = %q, want it capped at 100 before the wire", q.Get("limit"))
		}
		if q.Get("cursor") != "cur_abc" {
			t.Errorf("cursor = %q, want it handed back verbatim", q.Get("cursor"))
		}
	})
}
