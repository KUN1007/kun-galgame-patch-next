package client

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
)

const (
	bodyDocumented404 = `{"code":4,"message":"资源不存在"}`
	bodyRouter404     = `{"code":404,"message":"Cannot GET /v1/catalog/lookupp"}`
	bodyProxy404      = `<html><head><title>404 Not Found</title></head></html>`
)

type scripted struct {
	status int
	body   string
	mu     sync.Mutex
	calls  int
}

func (s *scripted) client(t *testing.T) *Client {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		s.mu.Lock()
		s.calls++
		s.mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(s.status)
		_, _ = w.Write([]byte(s.body))
	}))
	t.Cleanup(srv.Close)
	return NewWithKey(srv.URL, "nm_test_key")
}

func (s *scripted) count() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.calls
}

func ok(data string) string { return `{"code":0,"message":"ok","data":` + data + `}` }

func TestResolveGIDDecodeBranches(t *testing.T) {
	hit := ok(`{"work":{"id":900,"medium":"galgame","display_name":"W","content_rating":"all_ages"},` +
		`"claimed_by":{"site":"galgame_wiki","work_id":7,"state":"live","content_limit":"sfw"}}`)

	cases := []struct {
		name      string
		status    int
		body      string
		wantID    int64
		wantFound bool
		wantErr   bool
	}{
		{name: "resolved", status: 200, body: hit, wantID: 900, wantFound: true},
		{
			name: "null work block is a miss", status: 200,
			body: ok(`{"work":null,"claimed_by":null}`),
		},
		{
			name: "documented 404 — miss or hidden entity", status: 404,
			body: bodyDocumented404,
		},
		{
			name: "router 404 is a failure, not an absent gid", status: 404,
			body: bodyRouter404, wantErr: true,
		},
		{
			name: "gateway 404 carries no envelope", status: 404,
			body: bodyProxy404, wantErr: true,
		},
		{
			name: "data block is not an object", status: 200,
			body: ok(`"nope"`), wantErr: true,
		},
		{
			name: "business error on a 200", status: 200,
			body: bodyDocumented404, wantErr: true,
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			s := &scripted{status: tc.status, body: tc.body}
			id, found, err := s.client(t).resolveGID(context.Background(), 7)
			if (err != nil) != tc.wantErr {
				t.Fatalf("err = %v, wantErr = %v", err, tc.wantErr)
			}
			if err != nil {
				return
			}
			if id != tc.wantID || found != tc.wantFound {
				t.Errorf("resolveGID = (%d, %v), want (%d, %v)", id, found, tc.wantID, tc.wantFound)
			}
		})
	}

	t.Run("a non-positive gid never dials", func(t *testing.T) {
		s := &scripted{status: 200, body: hit}
		c := s.client(t)
		if _, found, err := c.resolveGID(context.Background(), 0); err != nil || found {
			t.Fatalf("resolveGID(0) = (%v, %v), want (false, nil)", found, err)
		}
		if s.count() != 0 {
			t.Errorf("calls = %d, want 0 — gid 0 is not an identity to resolve", s.count())
		}
	})

	t.Run("identity is cached after a hit", func(t *testing.T) {
		s := &scripted{status: 200, body: hit}
		c := s.client(t)
		for i := range 2 {
			if _, found, err := c.resolveGID(context.Background(), 7); err != nil || !found {
				t.Fatalf("call %d = (%v, %v), want found", i, found, err)
			}
		}
		if s.count() != 1 {
			t.Errorf("calls = %d, want 1 — the gid -> work id mapping is immutable", s.count())
		}
	})
}

func TestResolveGIDsDecodeBranches(t *testing.T) {
	item := func(externalID string, work string) string {
		return `{"source":"galgame_wiki","external_id":"` + externalID + `","work":` + work +
			`,"claimed_by":{"site":"galgame_wiki","work_id":7,"state":"live","content_limit":"sfw"}}`
	}
	const work900 = `{"id":900,"medium":"galgame","display_name":"W","content_rating":"all_ages"}`

	cases := []struct {
		name    string
		status  int
		body    string
		want    map[int]int64
		wantErr bool
	}{
		{
			name: "resolved", status: 200,
			body: ok(`{"items":[` + item("7", work900) + `]}`),
			want: map[int]int64{7: 900},
		},
		{
			name: "null work block drops the row", status: 200,
			body: ok(`{"items":[` + item("7", "null") + `]}`),
			want: map[int]int64{},
		},
		{
			name: "non-numeric external id drops the row", status: 200,
			body: ok(`{"items":[` + item("not-a-gid", work900) + `]}`),
			want: map[int]int64{},
		},
		{
			name: "malformed items block", status: 200,
			body: ok(`{"items":"nope"}`), wantErr: true,
		},
		{
			name: "envelope error surfaces", status: 200,
			body: bodyDocumented404, wantErr: true,
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			s := &scripted{status: tc.status, body: tc.body}
			got, err := s.client(t).resolveGIDs(context.Background(), []int{7})
			if (err != nil) != tc.wantErr {
				t.Fatalf("err = %v, wantErr = %v", err, tc.wantErr)
			}
			if err != nil {
				return
			}
			if len(got) != len(tc.want) {
				t.Fatalf("resolveGIDs = %v, want %v", got, tc.want)
			}
			for gid, id := range tc.want {
				if got[gid] != id {
					t.Errorf("resolveGIDs[%d] = %d, want %d", gid, got[gid], id)
				}
			}
		})
	}
}

func TestClaimStatesDecodeBranches(t *testing.T) {
	const work = `{"id":900,"medium":"galgame","display_name":"W","content_rating":"all_ages"}`
	claim := func(state string) string {
		return `{"site":"galgame_wiki","work_id":7,"state":"` + state + `","content_limit":"sfw"}`
	}
	row := func(externalID, work, claim string) string {
		return `{"source":"galgame_wiki","external_id":"` + externalID + `","work":` + work + `,"claimed_by":` + claim + `}`
	}

	cases := []struct {
		name string
		body string
		want map[int]string
	}{
		{
			name: "the three claim states pass through verbatim",
			body: ok(`{"items":[` +
				row("7", work, claim(catalogClaimStateLive)) + `,` +
				row("20", work, claim(catalogClaimStateDraft)) + `,` +
				row("21", work, claim(catalogClaimStateHidden)) + `]}`),
			want: map[int]string{7: "live", 20: "draft", 21: "hidden"},
		},
		{
			name: "registered but unclaimed reads as an empty state",
			body: ok(`{"items":[` + row("7", work, "null") + `]}`),
			want: map[int]string{7: ""},
		},
		{
			name: "unregistered gid is omitted entirely",
			body: ok(`{"items":[` + row("7", "null", "null") + `]}`),
			want: map[int]string{},
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			s := &scripted{status: 200, body: tc.body}
			got, err := s.client(t).ClaimStates(context.Background(), []int{7, 20, 21})
			if err != nil {
				t.Fatalf("ClaimStates: %v", err)
			}
			if len(got) != len(tc.want) {
				t.Fatalf("ClaimStates = %v, want %v", got, tc.want)
			}
			for gid, state := range tc.want {
				if got[gid] != state {
					t.Errorf("ClaimStates[%d] = %q, want %q", gid, got[gid], state)
				}
			}
		})
	}
}

func TestResolveWikiLabelDecodeBranches(t *testing.T) {
	cases := []struct {
		name      string
		status    int
		body      string
		wantID    int64
		wantFound bool
		wantErr   bool
	}{
		{
			name: "resolved", status: 200,
			body:   ok(`{"label":{"id":31,"display_name":"Brand"}}`),
			wantID: 31, wantFound: true,
		},
		{name: "null label block", status: 200, body: ok(`{"label":null}`)},
		{name: "documented 404", status: 404, body: bodyDocumented404},
		{name: "router 404 is a failure", status: 404, body: bodyRouter404, wantErr: true},
		{name: "gateway 404 is a failure", status: 404, body: bodyProxy404, wantErr: true},
		{name: "malformed data block", status: 200, body: ok(`"nope"`), wantErr: true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			s := &scripted{status: tc.status, body: tc.body}
			id, found, err := s.client(t).ResolveWikiLabel(context.Background(), 31)
			if (err != nil) != tc.wantErr {
				t.Fatalf("err = %v, wantErr = %v", err, tc.wantErr)
			}
			if err != nil {
				return
			}
			if id != tc.wantID || found != tc.wantFound {
				t.Errorf("ResolveWikiLabel = (%d, %v), want (%d, %v)", id, found, tc.wantID, tc.wantFound)
			}
		})
	}
}

func TestCheckGalgameByVndbIDDecodeBranches(t *testing.T) {
	cases := []struct {
		name       string
		status     int
		body       string
		wantExists bool
		wantGID    int
		wantErr    bool
	}{
		{
			name: "claimed by the wiki", status: 200,
			body:       ok(`{"work":{"id":900},"claimed_by":{"site":"galgame_wiki","work_id":7,"state":"live"}}`),
			wantExists: true, wantGID: 7,
		},
		{
			name: "registered but unclaimed", status: 200,
			body: ok(`{"work":{"id":900},"claimed_by":null}`),
		},
		{
			name: "claimed by another product face", status: 200,
			body: ok(`{"work":{"id":900},"claimed_by":{"site":"letmoe","work_id":7,"state":"live"}}`),
		},
		{name: "documented 404", status: 404, body: bodyDocumented404},
		{name: "router 404 is a failure", status: 404, body: bodyRouter404, wantErr: true},
		{name: "gateway 404 is a failure", status: 404, body: bodyProxy404, wantErr: true},
		{name: "malformed data block", status: 200, body: ok(`"nope"`), wantErr: true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			s := &scripted{status: tc.status, body: tc.body}
			exists, gid, err := s.client(t).CheckGalgameByVndbID(context.Background(), "v42")
			if (err != nil) != tc.wantErr {
				t.Fatalf("err = %v, wantErr = %v", err, tc.wantErr)
			}
			if err != nil {
				return
			}
			if exists != tc.wantExists || gid != tc.wantGID {
				t.Errorf("CheckGalgameByVndbID = (%v, %d), want (%v, %d)",
					exists, gid, tc.wantExists, tc.wantGID)
			}
		})
	}
}

func TestCatalogAbsentRequiresTheCatalogsOwnEnvelope(t *testing.T) {
	cases := []struct {
		name   string
		status int
		err    error
		want   bool
	}{
		{
			name: "404 + the catalog's not-found code", status: 404,
			err:  &GalgameError{Code: catalogCodeNotFound, Message: "资源不存在"},
			want: true,
		},
		{
			name: "404 + the router's status echo", status: 404,
			err: &GalgameError{Code: 404, Message: "Cannot GET /v1/catalog/lookupp"},
		},
		{
			name: "404 + a body that is not an envelope", status: 404,
			err: errParse(),
		},
		{
			name: "the not-found code without the 404", status: 200,
			err: &GalgameError{Code: catalogCodeNotFound},
		},
		{name: "a 500 is never absence", status: 500, err: &GalgameError{Code: 5}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := catalogAbsent(tc.status, tc.err); got != tc.want {
				t.Errorf("catalogAbsent = %v, want %v", got, tc.want)
			}
		})
	}
}

func errParse() error {
	return &parseError{msg: "解析 galgame 响应失败: " + strings.TrimSpace(bodyProxy404)}
}

type parseError struct{ msg string }

func (e *parseError) Error() string { return e.msg }
