package catalogclient

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
)

type userEditRecorder struct {
	method string
	path   string
	query  url.Values
	auth   string
	body   string
}

func newUserEditClient(t *testing.T, status int, reply string) (*Client, *userEditRecorder) {
	t.Helper()
	rec := &userEditRecorder{}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		raw, _ := io.ReadAll(r.Body)
		rec.method, rec.path, rec.query = r.Method, r.URL.Path, r.URL.Query()
		rec.auth, rec.body = r.Header.Get("Authorization"), string(raw)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		_, _ = w.Write([]byte(reply))
	}))
	t.Cleanup(srv.Close)
	return New(Config{BaseURL: srv.URL, ClientID: "moyu", ClientSecret: "s3cret"}), rec
}

func (r *userEditRecorder) assertBearerOnly(t *testing.T) {
	t.Helper()
	if r.auth != "Bearer "+editToken {
		t.Fatalf("Authorization = %q, want the user's Bearer token", r.auth)
	}
}

const editToken = "user-access-token"

func TestGetEditSchemaUserSendsNoActorParams(t *testing.T) {
	c, rec := newUserEditClient(t, http.StatusOK,
		`{"code":0,"data":{"entity_type":"catalog.work","fields":[{"key":"catalog.work.olang","can_propose":true}]}}`)

	sch, err := c.GetEditSchemaUser(context.Background(), editToken, EntityTypeWork, 9000)
	if err != nil {
		t.Fatalf("GetEditSchemaUser: %v", err)
	}
	if len(sch.Fields) != 1 || !sch.Fields[0].CanPropose {
		t.Fatalf("schema = %+v", sch)
	}
	if rec.method != http.MethodGet || rec.path != "/api/v1/user/catalog/edit/schema/catalog.work" {
		t.Fatalf("route: %s %s", rec.method, rec.path)
	}
	if rec.query.Get("entity_id") != "9000" || len(rec.query) != 1 {
		t.Fatalf("query = %v; the user plane names no actor", rec.query)
	}
	rec.assertBearerOnly(t)
}

func TestEditSchemaFieldKeepsEveryWireKey(t *testing.T) {
	c, _ := newUserEditClient(t, http.StatusOK, `{"code":0,"data":{"entity_type":"catalog.work","fields":[`+
		`{"key":"catalog.work.titles","kind":"list","diff_hint":"items","locked":false,"can_propose":true,`+
		`"can_review":true,"would_automerge":true,"max_elements":40,"max_suppressed":200},`+
		`{"key":"catalog.work.legacy","kind":"text","diff_hint":"inline","deprecated":true,"locked":true,`+
		`"can_propose":false,"can_review":false,"would_automerge":false}]}}`)

	sch, err := c.GetEditSchemaUser(context.Background(), editToken, EntityTypeWork, 9000)
	if err != nil {
		t.Fatalf("GetEditSchemaUser: %v", err)
	}
	want := EditSchemaField{
		Key: "catalog.work.titles", Kind: "list", DiffHint: "items",
		CanPropose: true, CanReview: true, WouldAutomerge: true,
		MaxElements: 40, MaxSuppressed: 200,
	}
	if sch.Fields[0] != want {
		t.Fatalf("titles decoded as %+v, want %+v", sch.Fields[0], want)
	}
	if !sch.Fields[1].Deprecated {
		t.Fatalf("deprecated must survive the decode: %+v", sch.Fields[1])
	}

	out, err := json.Marshal(sch.Fields[0])
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	for _, key := range []string{`"key"`, `"kind"`, `"diff_hint"`, `"locked"`, `"can_propose"`,
		`"can_review"`, `"would_automerge"`, `"max_suppressed":200`, `"max_elements":40`} {
		if !strings.Contains(string(out), key) {
			t.Fatalf("the bootstrap passthrough lost %s: %s", key, out)
		}
	}
	if strings.Contains(string(out), `"deprecated"`) {
		t.Fatalf("deprecated is omitempty on the wire and must not be re-emitted false: %s", out)
	}
	legacy, err := json.Marshal(sch.Fields[1])
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if !strings.Contains(string(legacy), `"deprecated":true`) {
		t.Fatalf("deprecated lost on the way out: %s", legacy)
	}
}

func TestGetEditSnapshotUserIsTheEnginesCurrentValues(t *testing.T) {
	c, rec := newUserEditClient(t, http.StatusOK,
		`{"code":0,"data":{"entity_type":"catalog.work","entity_id":9000,"values":{`+
			`"catalog.work.display_name":"作品名","catalog.work.olang":"ja","catalog.work.content_rating":2,`+
			`"catalog.work.titles":[{"lang":"ja","title":"作品名","kind":0}]}}}`)

	snap, err := c.GetEditSnapshotUser(context.Background(), editToken, EntityTypeWork, 9000)
	if err != nil {
		t.Fatalf("GetEditSnapshotUser: %v", err)
	}
	if rec.path != "/api/v1/user/catalog/edit/snapshot" {
		t.Fatalf("route: %s", rec.path)
	}
	if rec.query.Get("entity_type") != EntityTypeWork || rec.query.Get("entity_id") != "9000" {
		t.Fatalf("query = %v", rec.query)
	}
	if snap.Values["catalog.work.display_name"] != "作品名" {
		t.Fatalf("values = %v", snap.Values)
	}
	rec.assertBearerOnly(t)
}

func TestCreateEditProposalUserNamesNobody(t *testing.T) {
	c, rec := newUserEditClient(t, http.StatusOK,
		`{"code":0,"data":{"merged":true,"proposal":{"id":31,"status":"merged"},"revision":{"id":77,"seq":1,"action":"direct"}}}`)

	res, err := c.CreateEditProposalUser(context.Background(), editToken, UserEditCreateRequest{
		EntityType: EntityTypeWork, EntityID: 9000,
		Patch: map[string]any{"catalog.work.display_name": "新名"}, Note: "fix",
	})
	if err != nil {
		t.Fatalf("CreateEditProposalUser: %v", err)
	}
	if !res.Merged || res.Revision == nil || res.Revision.Seq != 1 || res.Proposal.ID != 31 {
		t.Fatalf("direct-merge sugar lost: %+v", res)
	}
	if rec.method != http.MethodPost || rec.path != "/api/v1/user/catalog/edit/proposals" {
		t.Fatalf("route: %s %s", rec.method, rec.path)
	}
	rec.assertBearerOnly(t)

	var sent map[string]any
	if err := json.Unmarshal([]byte(rec.body), &sent); err != nil {
		t.Fatalf("body is not JSON: %v", err)
	}
	for _, k := range []string{"actor", "site", "user_id", "trust_tier", "proposer_uid", "roles"} {
		if _, ok := sent[k]; ok {
			t.Fatalf("the user plane must not carry %q: %v", k, sent)
		}
	}
	if sent["entity_type"] != EntityTypeWork || sent["entity_id"] != float64(9000) || sent["note"] != "fix" {
		t.Fatalf("create body = %v", sent)
	}
}

func TestWithdrawEditProposalUserIsBodiless(t *testing.T) {
	c, rec := newUserEditClient(t, http.StatusOK, `{"code":0,"data":{"id":32,"status":"withdrawn"}}`)

	prop, err := c.WithdrawEditProposalUser(context.Background(), editToken, 32)
	if err != nil {
		t.Fatalf("WithdrawEditProposalUser: %v", err)
	}
	if prop.Status != "withdrawn" {
		t.Fatalf("prop = %+v", prop)
	}
	if rec.method != http.MethodPost || rec.path != "/api/v1/user/catalog/edit/proposals/32/withdraw" {
		t.Fatalf("route: %s %s", rec.method, rec.path)
	}
	if rec.body != "" {
		t.Fatalf("withdraw must send no body, got %q", rec.body)
	}
	rec.assertBearerOnly(t)
}

func TestMyEditProposalsAsksForMineOnly(t *testing.T) {
	c, rec := newUserEditClient(t, http.StatusOK,
		`{"code":0,"data":{"items":[{"id":32,"status":"open"}],"total":1}}`)

	items, err := c.MyEditProposals(context.Background(), editToken, EntityTypeWork, 9000, "", 20)
	if err != nil {
		t.Fatalf("MyEditProposals: %v", err)
	}
	if len(items) != 1 || items[0].ID != 32 {
		t.Fatalf("items = %+v", items)
	}
	if rec.path != "/api/v1/user/catalog/edit/proposals" {
		t.Fatalf("route: %s", rec.path)
	}
	if rec.query.Get("mine") != "true" || rec.query.Get("entity_type") != EntityTypeWork ||
		rec.query.Get("entity_id") != "9000" || rec.query.Get("limit") != "20" {
		t.Fatalf("query = %v", rec.query)
	}
	for _, k := range []string{"proposer_uid", "site", "user_id", "trust_tier"} {
		if rec.query.Has(k) {
			t.Fatalf("query must not carry %q: %v", k, rec.query)
		}
	}
	rec.assertBearerOnly(t)
}

func TestEditScopeDenialIsItsOwnSentinel(t *testing.T) {
	ctx := context.Background()

	t.Run("403 naming the scope", func(t *testing.T) {
		c, _ := newUserEditClient(t, http.StatusForbidden,
			`{"code":40300,"message":"the access token is missing the catalog:edit scope"}`)
		_, err := c.MyEditProposals(ctx, editToken, EntityTypeWork, 0, "", 0)
		if !errors.Is(err, ErrInsufficientScope) {
			t.Fatalf("err = %v, want ErrInsufficientScope", err)
		}
	})

	t.Run("403 without the word scope stays a plain API error", func(t *testing.T) {
		c, _ := newUserEditClient(t, http.StatusForbidden,
			`{"code":40300,"message":"编辑该条目需要更高的信任等级"}`)
		_, err := c.CreateEditProposalUser(ctx, editToken, UserEditCreateRequest{EntityType: EntityTypeWork, EntityID: 1})
		if errors.Is(err, ErrInsufficientScope) {
			t.Fatal("a permission refusal must not read as a stale scope")
		}
		var apiErr *APIError
		if !errors.As(err, &apiErr) || apiErr.Status != http.StatusForbidden {
			t.Fatalf("err = %v, want a 403 APIError", err)
		}
	})
}

func TestEditUserPlaneNeverDialsWithoutAToken(t *testing.T) {
	ctx := context.Background()
	srv := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		t.Error("a token-less call must short-circuit before any network call")
	}))
	t.Cleanup(srv.Close)
	c := New(Config{BaseURL: srv.URL, ClientID: "moyu", ClientSecret: "s3cret"})

	if _, err := c.GetEditSchemaUser(ctx, "", EntityTypeWork, 1); !errors.Is(err, ErrNoAccessToken) {
		t.Fatalf("schema: %v", err)
	}
	if _, err := c.GetEditSnapshotUser(ctx, "", EntityTypeWork, 1); !errors.Is(err, ErrNoAccessToken) {
		t.Fatalf("snapshot: %v", err)
	}
	if _, err := c.CreateEditProposalUser(ctx, "", UserEditCreateRequest{EntityType: EntityTypeWork, EntityID: 1}); !errors.Is(err, ErrNoAccessToken) {
		t.Fatalf("create: %v", err)
	}
	if _, err := c.WithdrawEditProposalUser(ctx, "", 1); !errors.Is(err, ErrNoAccessToken) {
		t.Fatalf("withdraw: %v", err)
	}
	if _, err := c.MyEditProposals(ctx, "", EntityTypeWork, 1, "", 0); !errors.Is(err, ErrNoAccessToken) {
		t.Fatalf("list: %v", err)
	}

	if _, err := New(Config{}).GetEditSchemaUser(ctx, editToken, EntityTypeWork, 1); !errors.Is(err, ErrNotConfigured) {
		t.Fatalf("unconfigured: %v", err)
	}
}
