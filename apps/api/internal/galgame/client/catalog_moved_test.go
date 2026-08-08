package client

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestMovedTargetClassification(t *testing.T) {
	for _, tc := range []struct {
		name string
		err  error
		want int64
	}{
		{
			name: "the catalog's own merge verdict",
			err:  &GalgameError{Code: catalogCodeMoved, HTTPStatus: http.StatusMovedPermanently, Moved: 6935},
			want: 6935,
		},
		{
			name: "a 301 with no merge code is not a merge",
			err:  &GalgameError{Code: 233, HTTPStatus: http.StatusMovedPermanently, Moved: 6935},
		},
		{
			name: "the merge code without the 301 is not a merge either",
			err:  &GalgameError{Code: catalogCodeMoved, HTTPStatus: http.StatusOK, Moved: 6935},
		},
		{
			name: "a merge verdict with no target is not actionable",
			err:  &GalgameError{Code: catalogCodeMoved, HTTPStatus: http.StatusMovedPermanently},
		},
		{
			name: "a plain miss is not a merge",
			err:  &GalgameError{Code: catalogCodeNotFound, HTTPStatus: http.StatusNotFound},
		},
		{name: "no error at all"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			to, ok := MovedTarget(tc.err)
			if (tc.want > 0) != ok || to != tc.want {
				t.Fatalf("MovedTarget = (%d, %v), want (%d, %v)", to, ok, tc.want, tc.want > 0)
			}
		})
	}
}

func TestGetV1DoesNotFollowTheMergeRedirect(t *testing.T) {
	var seen []string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = append(seen, r.URL.Path)
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/v1/catalog/labels/13323" {
			w.Header().Set("Location", "/v1/catalog/labels/6935")
			w.WriteHeader(http.StatusMovedPermanently)
			_, _ = w.Write([]byte(`{"code":12,"message":"merged","data":{"current_id":6935}}`))
			return
		}
		_, _ = w.Write([]byte(`{"code":0,"message":"成功","data":{"id":6935,"display_name":"生存ブランド"}}`))
	}))
	t.Cleanup(upstream.Close)

	c := NewWithKey(upstream.URL, "nm_test_key")
	var rec catalogLabelRecord
	err := c.getV1(context.Background(), "/catalog/labels/13323", nil, &rec)
	to, ok := MovedTarget(err)
	if !ok || to != 6935 {
		t.Fatalf("MovedTarget = (%d, %v), want (6935, true); err=%v", to, ok, err)
	}
	if rec.DisplayName != "" {
		t.Fatalf("the survivor's record leaked under the dead id: %q", rec.DisplayName)
	}
	if len(seen) != 1 || seen[0] != "/v1/catalog/labels/13323" {
		t.Fatalf("client followed the redirect: %v", seen)
	}
}
