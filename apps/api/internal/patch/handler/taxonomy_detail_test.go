package handler

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	galgameClient "kun-galgame-patch-api/internal/galgame/client"

	"github.com/gofiber/fiber/v3"
)

func TestGalgameTaxonomyDetailStatusCodes(t *testing.T) {
	const (
		recordMiss  = `{"code":"NOT_FOUND","status":404,"title":"Not found"}`
		routeGone   = `{"code":"NOT_FOUND","status":404,"title":"Not found","detail":"Cannot GET /v2/catalog/tagz/11"}`
		serverDown  = `{"code":"INTERNAL","status":500,"title":"Internal error"}`
		recordMoved = `{"code":"ENTITY_MERGED","status":404,"current_id":"6935"}`
	)

	for _, tc := range []struct {
		name             string
		path             string
		upstreamStatus   int
		upstreamLocation string
		upstreamBody     string
		wantStatus       int
		wantBodyHas      string
	}{
		{
			name:           "a tag the registry has no row for is a real 404",
			path:           "/api/v1/tag/_?tag_id=99999999",
			upstreamStatus: http.StatusNotFound, upstreamBody: recordMiss,
			wantStatus: http.StatusNotFound, wantBodyHas: `"code":40400`,
		},
		{
			name:           "an official the registry has no row for is a real 404",
			path:           "/api/v1/official/_?official_id=99999999",
			upstreamStatus: http.StatusNotFound, upstreamBody: recordMiss,
			wantStatus: http.StatusNotFound, wantBodyHas: `"code":40400`,
		},
		{
			name:       "an id that is not a number never reaches the catalog, and is still a miss",
			path:       "/api/v1/tag/_?tag_id=abc",
			wantStatus: http.StatusNotFound, wantBodyHas: `"code":40400`,
		},
		{
			name:             "a merged official forwards to its survivor",
			path:             "/api/v1/official/_?official_id=13323",
			upstreamStatus:   http.StatusNotFound,
			upstreamLocation: "/v2/catalog/companies/6935",
			upstreamBody:     recordMoved,
			wantStatus:       http.StatusOK, wantBodyHas: `"moved_to":6935`,
		},
		{
			name:           "an upstream route failure is a miss on v2",
			path:           "/api/v1/tag/_?tag_id=11",
			upstreamStatus: http.StatusNotFound, upstreamBody: routeGone,
			wantStatus: http.StatusNotFound, wantBodyHas: `"code":40400`,
		},
		{
			name:           "the registry falling over is not a missing tag either",
			path:           "/api/v1/tag/_?tag_id=11",
			upstreamStatus: http.StatusInternalServerError, upstreamBody: serverDown,
			wantStatus: http.StatusBadRequest,
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				if tc.upstreamLocation != "" {
					w.Header().Set("Location", tc.upstreamLocation)
				}
				if tc.upstreamStatus != 0 {
					w.WriteHeader(tc.upstreamStatus)
				}
				_, _ = w.Write([]byte(tc.upstreamBody))
			}))
			t.Cleanup(upstream.Close)

			h := New(nil, galgameClient.NewWithKey(upstream.URL, "nm_test_key"), nil)
			app := fiber.New()
			app.Get("/api/v1/tag/:name", h.GalgameTaxonomyDetailProxy)
			app.Get("/api/v1/official/:name", h.GalgameTaxonomyDetailProxy)

			req, _ := http.NewRequest(http.MethodGet, "http://localhost"+tc.path, nil)
			resp, err := app.Test(req)
			if err != nil {
				t.Fatalf("app.Test: %v", err)
			}
			defer resp.Body.Close()
			body, _ := io.ReadAll(resp.Body)

			if resp.StatusCode != tc.wantStatus {
				t.Fatalf("status = %d, want %d (body=%s)", resp.StatusCode, tc.wantStatus, body)
			}
			if tc.wantBodyHas != "" && !strings.Contains(string(body), tc.wantBodyHas) {
				t.Errorf("body = %s, want it to carry %s", body, tc.wantBodyHas)
			}
		})
	}
}
