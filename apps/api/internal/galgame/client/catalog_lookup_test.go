package client

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strconv"
	"sync"
	"testing"
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

func v2List(items string) string {
	if items == "" {
		return `{"object":"list","items":[]}`
	}
	return `{"object":"list","items":[` + items + `]}`
}

func v2Work(id int64, gid int) string {
	g := strconv.Itoa(gid)
	return `{"object":"work","id":"` + strconv.FormatInt(id, 10) + `","refs":[` +
		`{"source":"galgame_wiki","external_id":"` + g + `"},` +
		`{"source":"curated","external_id":"` + g + `"}],` +
		`"claim":{"site":"galgame_wiki","site_work_id":"` + g + `","state":"live","content_limit":"sfw"}}`
}

func TestResolveGIDDecodeBranches(t *testing.T) {
	hit := v2List(v2Work(900, 7))
	cases := []struct {
		name      string
		status    int
		body      string
		wantID    int64
		wantFound bool
		wantErr   bool
	}{
		{name: "resolved", status: 200, body: hit, wantID: 900, wantFound: true},
		{name: "empty list is a miss", status: 200, body: v2List("")},
		{name: "documented 404 is a miss", status: 404, body: `{"code":"NOT_FOUND","status":404}`},
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
			t.Errorf("calls = %d, want 0", s.count())
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
			t.Errorf("calls = %d, want 1", s.count())
		}
	})
}

func TestResolveGIDsDecodeBranches(t *testing.T) {
	s := &scripted{status: 200, body: v2List(v2Work(900, 7))}
	got, err := s.client(t).resolveGIDs(context.Background(), []int{7})
	if err != nil {
		t.Fatalf("resolveGIDs: %v", err)
	}
	if got[7] != 900 {
		t.Fatalf("resolveGIDs = %v, want map[7:900]", got)
	}
}

func TestClaimStatesDecodeBranches(t *testing.T) {
	body := v2List(
		`{"object":"work","id":"900","claim":{"site":"galgame_wiki","site_work_id":"7","state":"live","content_limit":"sfw"},"refs":[{"source":"galgame_wiki","external_id":"7"},{"source":"curated","external_id":"7"}]}`,
	)
	s := &scripted{status: 200, body: body}
	got, err := s.client(t).ClaimStates(context.Background(), []int{7})
	if err != nil {
		t.Fatalf("ClaimStates: %v", err)
	}
	if got[7] != catalogClaimStateLive {
		t.Fatalf("ClaimStates = %v, want live for 7", got)
	}
}

func TestResolveWikiLabelDecodeBranches(t *testing.T) {
	s := &scripted{status: 200, body: v2List(`{"id":"31","display_name":"Brand"}`)}
	id, found, err := s.client(t).ResolveWikiLabel(context.Background(), 31)
	if err != nil || !found || id != 31 {
		t.Fatalf("ResolveWikiLabel = (%d, %v, %v), want (31, true, nil)", id, found, err)
	}
}

func TestCheckGalgameByVndbIDDecodeBranches(t *testing.T) {
	s := &scripted{status: 200, body: v2List(
		`{"object":"work","id":"900","claim":{"site":"galgame_wiki","site_work_id":"7","state":"live","content_limit":"sfw"}}`,
	)}
	exists, gid, err := s.client(t).CheckGalgameByVndbID(context.Background(), "v1")
	if err != nil || !exists || gid != 7 {
		t.Fatalf("CheckGalgameByVndbID = (%v, %d, %v), want (true, 7, nil)", exists, gid, err)
	}
}

func TestCatalogAbsentRequiresTheCatalogsOwnEnvelope(t *testing.T) {
	if !catalogAbsent(&GalgameError{Code: catalogCodeNotFound, HTTPStatus: 404}) {
		t.Fatal("404 + catalog not-found must be absence")
	}
	if catalogAbsent(&GalgameError{Code: 5, HTTPStatus: 500}) {
		t.Fatal("a 500 is never absence")
	}
}
