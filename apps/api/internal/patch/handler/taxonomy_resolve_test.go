package handler

// The old-URL resolver's STATUS LINE, pinned.
//
// /tag/:id and /official/:id are pure redirect shells over this route (wave
// A2-2 / R1), and a shell can only be as honest as the verdict it is handed.
// Every non-resolving answer here has to be a real status: a shell that gets
// "no" and still renders 200 is a soft 404 — the crawler keeps the dead URL
// indexed, keeps spending budget on it, and reads the "已退役" copy as thin
// content on a live page. So the three verdicts are three status codes, and the
// fourth case — the resolver itself failing — is deliberately NOT one of them.

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	galgameClient "kun-galgame-patch-api/internal/galgame/client"

	"github.com/gofiber/fiber/v3"
)

func TestResolveTaxonomyIDStatusCodes(t *testing.T) {
	// The label lane resolves LIVE through the catalog, so it needs an upstream.
	// The tag lane reads the vendored table and never dials, whatever this says.
	const (
		labelHit = `{"code":0,"message":"ok","data":{"label":{"id":8801,"display_name":"Brand"}}}`
		// The catalog's own miss: the standard envelope + its not-found code.
		labelMiss = `{"code":4,"message":"资源不存在"}`
		// A ROUTE-level 404 — the router echoing the status into `code`. It is not
		// a verdict about this official, and must not be reported as one.
		routeGone = `{"code":404,"message":"Cannot GET /v1/catalog/lookupp"}`
	)

	cases := []struct {
		name           string
		path           string
		upstreamStatus int
		upstreamBody   string
		wantStatus     int
		wantBodyHas    string
	}{
		{
			name: "a mapped wiki tag resolves to its successor",
			path: "/taxonomy/resolve/tag/1",
			// The first row of the vendored A2-0 artifact: wiki tag 1 -> catalog 55.
			wantStatus: http.StatusOK, wantBodyHas: `"catalog_id":55`,
		},
		{
			name: "a parked wiki tag is GONE, not missing",
			path: "/taxonomy/resolve/tag/15",
			// 410: we published this URL and its vocabulary entry is retired
			// forever. "Never heard of it" would be a different and false claim.
			wantStatus: http.StatusGone,
		},
		{
			name:       "an id that was never a wiki tag is a plain 404",
			path:       "/taxonomy/resolve/tag/99999999",
			wantStatus: http.StatusNotFound,
		},
		{
			name:           "a registered official resolves through the live lookup",
			path:           "/taxonomy/resolve/official/31",
			upstreamStatus: http.StatusOK, upstreamBody: labelHit,
			wantStatus: http.StatusOK, wantBodyHas: `"catalog_id":8801`,
		},
		{
			name:           "an official the registry has no anchor for is a 404",
			path:           "/taxonomy/resolve/official/31",
			upstreamStatus: http.StatusNotFound, upstreamBody: labelMiss,
			wantStatus: http.StatusNotFound,
		},
		{
			// The case that used to be indistinguishable from the one above: the
			// catalog never answered, so this URL's fate is UNKNOWN. Reporting 404
			// would retire a live official because a path was renamed.
			name:           "an upstream route failure is a failure, not a missing official",
			path:           "/taxonomy/resolve/official/31",
			upstreamStatus: http.StatusNotFound, upstreamBody: routeGone,
			wantStatus: http.StatusInternalServerError,
		},
		{
			name:       "an unknown family is a bad request",
			path:       "/taxonomy/resolve/character/1",
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "a non-numeric id is a bad request",
			path:       "/taxonomy/resolve/tag/abc",
			wantStatus: http.StatusBadRequest,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				if tc.upstreamStatus != 0 {
					w.WriteHeader(tc.upstreamStatus)
				}
				_, _ = w.Write([]byte(tc.upstreamBody))
			}))
			t.Cleanup(upstream.Close)

			// service / users are nil on purpose: this route reads the vendored tag
			// table and the catalog client, and nothing else. A nil that never
			// panics is itself the proof.
			h := New(nil, galgameClient.NewWithKey(upstream.URL, "nm_test_key"), nil)
			app := fiber.New()
			app.Get("/taxonomy/resolve/:kind/:id", h.ResolveTaxonomyID)

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
