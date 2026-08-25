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
			name: "v2 merge verdict",
			err:  &GalgameError{Code: catalogCodeMoved, HTTPStatus: http.StatusNotFound, Moved: 6935},
			want: 6935,
		},
		{
			name: "legacy 301 merge verdict",
			err:  &GalgameError{Code: catalogCodeMoved, HTTPStatus: http.StatusMovedPermanently, Moved: 6935},
			want: 6935,
		},
		{
			name: "a 301 with no merge code is not a merge",
			err:  &GalgameError{Code: 233, HTTPStatus: http.StatusMovedPermanently, Moved: 6935},
		},
		{
			name: "the merge code without a merge status is not a merge either",
			err:  &GalgameError{Code: catalogCodeMoved, HTTPStatus: http.StatusOK, Moved: 6935},
		},
		{
			name: "a merge verdict with no target is not actionable",
			err:  &GalgameError{Code: catalogCodeMoved, HTTPStatus: http.StatusNotFound},
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

func TestCompanyMergeDoesNotFollow(t *testing.T) {
	var seen []string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = append(seen, r.URL.Path)
		w.Header().Set("Content-Type", "application/problem+json")
		if r.URL.Path == "/v2/catalog/companies/13323" {
			w.WriteHeader(http.StatusNotFound)
			_, _ = w.Write([]byte(`{"code":"ENTITY_MERGED","status":404,"current_id":"6935"}`))
			return
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"id":"6935","display_name":"生存ブランド"}`))
	}))
	t.Cleanup(upstream.Close)

	c := NewWithKey(upstream.URL, "nmk_test_key")
	_, err := c.v2.GetCompany(context.Background(), 13323, true)
	to, ok := MovedTarget(catalogErr(err))
	if !ok || to != 6935 {
		t.Fatalf("MovedTarget = (%d, %v), want (6935, true); err=%v", to, ok, err)
	}
	if len(seen) != 1 || seen[0] != "/v2/catalog/companies/13323" {
		t.Fatalf("client followed the merge: %v", seen)
	}
}
