package catalogclient

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
)

func newTestClient(t *testing.T, h http.HandlerFunc) *Client {
	t.Helper()
	srv := httptest.NewServer(h)
	t.Cleanup(srv.Close)
	return New(Config{BaseURL: srv.URL, ClientID: "moyu", ClientSecret: "s3cret"})
}

func writeEnvelope(t *testing.T, w http.ResponseWriter, status int, code int, message string, data any) {
	t.Helper()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	raw, err := json.Marshal(map[string]any{"code": code, "message": message, "data": data})
	if err != nil {
		t.Fatalf("encode stub envelope: %v", err)
	}
	_, _ = w.Write(raw)
}

func TestSubmitWorkUserSpeaksAsTheToken(t *testing.T) {
	var gotAuth, gotPath, gotMethod string
	var gotBody map[string]any
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		gotAuth, gotPath, gotMethod = r.Header.Get("Authorization"), r.URL.Path, r.Method
		raw, _ := io.ReadAll(r.Body)
		if err := json.Unmarshal(raw, &gotBody); err != nil {
			t.Errorf("submission body is not JSON: %v", err)
		}
		writeEnvelope(t, w, http.StatusOK, 0, "OK", map[string]any{
			"work_id": 4242, "product_work_id": 4242, "claim_state": "pending", "event_id": 9,
		})
	})

	out, err := c.SubmitWorkUser(context.Background(), "tok-abc", UserWorkSubmitRequest{
		Fields: map[string]any{"display_name": "テスト"},
	})
	if err != nil {
		t.Fatalf("SubmitWorkUser: %v", err)
	}
	if gotMethod != http.MethodPost || gotPath != "/api/v1/user/catalog/works/submit" {
		t.Fatalf("wrong route: %s %s", gotMethod, gotPath)
	}
	if gotAuth != "Bearer tok-abc" {
		t.Fatalf("Authorization = %q, want the user's Bearer token", gotAuth)
	}
	if _, ok := gotBody["site"]; ok {
		t.Error("the user plane must not carry a site field")
	}
	if _, ok := gotBody["actor"]; ok {
		t.Error("the user plane must not carry an actor field")
	}
	if _, ok := gotBody["product_work_id"]; ok {
		t.Error("moyu mints no product id; the field must be omitted entirely")
	}
	if out.WorkID != 4242 || out.ClaimState != "pending" {
		t.Fatalf("unexpected result %+v", out)
	}
}

func TestActOnClaimUserRouteAndBody(t *testing.T) {
	var gotPath, gotAuth string
	var gotBody map[string]any
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		gotPath, gotAuth = r.URL.Path, r.Header.Get("Authorization")
		raw, _ := io.ReadAll(r.Body)
		_ = json.Unmarshal(raw, &gotBody)
		writeEnvelope(t, w, http.StatusOK, 0, "OK", map[string]any{
			"work_id": 7, "from_state": "draft", "to_state": "live", "event_id": 31,
		})
	})

	out, err := c.ActOnClaimUser(context.Background(), "tok-xyz", 7, ClaimActionPublish, UserClaimActionRequest{})
	if err != nil {
		t.Fatalf("ActOnClaimUser: %v", err)
	}
	if gotPath != "/api/v1/user/catalog/works/7/claim-actions/publish" {
		t.Fatalf("wrong route: %s", gotPath)
	}
	if gotAuth != "Bearer tok-xyz" {
		t.Fatalf("Authorization = %q", gotAuth)
	}
	if len(gotBody) != 0 {
		t.Fatalf("an owner action names nothing; body = %v", gotBody)
	}
	if out.To != "live" || out.EventID != 31 {
		t.Fatalf("unexpected result %+v", out)
	}
}

func TestMyClaimsSendsNoUIDAndNoSite(t *testing.T) {
	var gotPath string
	var gotQuery url.Values
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		gotPath, gotQuery = r.URL.Path, r.URL.Query()
		writeEnvelope(t, w, http.StatusOK, 0, "OK", map[string]any{
			"items": []map[string]any{{
				"work_id": 12, "display_name": "A", "site": "kungal", "claim_state": "pending",
				"last_event_id": 90, "last_to_state": "pending",
			}},
			"next_before": 90, "total": 3,
		})
	})

	page, err := c.MyClaims(context.Background(), "tok", UserClaimFilter{
		ClaimStates: []string{"pending", "declined"}, Before: 100, Limit: 20,
	})
	if err != nil {
		t.Fatalf("MyClaims: %v", err)
	}
	if gotPath != "/api/v1/user/catalog/claims/mine" {
		t.Fatalf("wrong route: %s", gotPath)
	}
	if _, ok := gotQuery["site"]; ok {
		t.Error("site must not travel on the user plane")
	}
	if got := gotQuery.Get; got("claim_state") != "pending,declined" || got("before") != "100" || got("limit") != "20" {
		t.Fatalf("unexpected query %v", gotQuery)
	}
	if page.Total != 3 || len(page.Items) != 1 || page.NextBefore != 90 {
		t.Fatalf("unexpected page %+v", page)
	}
}

func TestScopeDenialIsItsOwnSentinel(t *testing.T) {
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		writeEnvelope(t, w, http.StatusForbidden, 40300,
			"the access token is missing the catalog:edit scope", nil)
	})
	_, err := c.SubmitWorkUser(context.Background(), "tok", UserWorkSubmitRequest{
		Fields: map[string]any{"display_name": "x"},
	})
	if !errors.Is(err, ErrInsufficientScope) {
		t.Fatalf("err = %v, want ErrInsufficientScope", err)
	}
}

func TestOtherForbiddenKeepsUpstreamWording(t *testing.T) {
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		writeEnvelope(t, w, http.StatusForbidden, 40300, "this claim belongs to another user", nil)
	})
	_, err := c.SubmitWorkUser(context.Background(), "tok", UserWorkSubmitRequest{
		Fields: map[string]any{"display_name": "x"},
	})
	if errors.Is(err, ErrInsufficientScope) {
		t.Fatal("an ownership refusal must not read as a stale scope")
	}
	var apiErr *APIError
	if !errors.As(err, &apiErr) || apiErr.Status != http.StatusForbidden ||
		apiErr.Message != "this claim belongs to another user" {
		t.Fatalf("err = %v, want the upstream wording preserved", err)
	}
}

func TestUserPlaneRefusesToDialWithoutAToken(t *testing.T) {
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		t.Error("a token-less call must never reach the network")
	})
	if _, err := c.MyClaims(context.Background(), "", UserClaimFilter{}); !errors.Is(err, ErrNoAccessToken) {
		t.Fatalf("err = %v, want ErrNoAccessToken", err)
	}
}
