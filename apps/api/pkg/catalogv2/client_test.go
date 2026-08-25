package catalogv2_test

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"kun-galgame-patch-api/pkg/catalogv2"
)

func TestOriginStripsLegacySuffix(t *testing.T) {
	c := catalogv2.New("http://catalog:9281/api/v1", "nmk_test_x")
	if !c.Configured() {
		t.Fatal("configured")
	}
}

func TestListWorksUsesBearerAndNoEnvelope(t *testing.T) {
	var gotAuth, gotPath, gotNSFW string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		gotPath = r.URL.Path
		gotNSFW = r.URL.Query().Get("nsfw")
		if r.Header.Get("X-API-Key") != "" {
			t.Error("X-API-Key must not be sent")
		}
		_ = json.NewEncoder(w).Encode(map[string]any{
			"object": "list",
			"items": []map[string]any{{
				"object": "work", "id": "4", "display_name": "Summer Pockets REFLECTION BLUE",
			}},
			"total": 1,
		})
	}))
	t.Cleanup(srv.Close)

	c := catalogv2.New(srv.URL, "nmk_test_abcdefghijklmnopqrstuvwx12")
	page, err := c.ListWorks(context.Background(), catalogv2.WorksQuery{
		Q: "夏", Sort: "relevance", NSFW: true, IncludeTotal: true,
	})
	if err != nil {
		t.Fatal(err)
	}
	if gotAuth != "Bearer nmk_test_abcdefghijklmnopqrstuvwx12" {
		t.Fatalf("auth %q", gotAuth)
	}
	if gotPath != "/v2/catalog/works" {
		t.Fatalf("path %q", gotPath)
	}
	if gotNSFW != "true" {
		t.Fatalf("nsfw %q", gotNSFW)
	}
	if len(page.Items) != 1 || page.Items[0].ID != "4" || page.Count() != 1 {
		t.Fatalf("%+v", page)
	}
}

func TestGetWork404(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/problem+json")
		w.WriteHeader(http.StatusNotFound)
		_, _ = io.WriteString(w, `{"code":"NOT_FOUND","status":404,"title":"Not found"}`)
	}))
	t.Cleanup(srv.Close)
	c := catalogv2.New(srv.URL, "nmk_test_x")
	_, err := c.GetWork(context.Background(), 1, false)
	if !errors.Is(err, catalogv2.ErrNotFound) {
		t.Fatalf("%v", err)
	}
}

func TestMergedProblem(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/problem+json")
		w.WriteHeader(http.StatusNotFound)
		_, _ = io.WriteString(w, `{"code":"ENTITY_MERGED","status":404,"current_id":"6935"}`)
	}))
	t.Cleanup(srv.Close)
	c := catalogv2.New(srv.URL, "k")
	_, err := c.GetCompany(context.Background(), 13323, true)
	var p *catalogv2.Problem
	if !errors.As(err, &p) || !p.Merged() || p.CurrentID != "6935" {
		t.Fatalf("%v", err)
	}
}

func TestPageCursor(t *testing.T) {
	if catalogv2.PageCursor(1) != "" {
		t.Fatal("page 1")
	}
	if !strings.HasPrefix(catalogv2.PageCursor(2), "cur_") {
		t.Fatal("page 2")
	}
}

func TestUnconfigured(t *testing.T) {
	c := catalogv2.New("", "")
	if _, err := c.ListWorks(context.Background(), catalogv2.WorksQuery{}); !errors.Is(err, catalogv2.ErrNotConfigured) {
		t.Fatalf("%v", err)
	}
}
