package handler

// The taxonomy browse pages' STATUS LINE, pinned.
//
// /galgame/tag/:id and /galgame/official/:id render off these two reads, and a
// page can only be as honest as the answer it is handed. An id the registry has
// no row for has to come back as a MISS so the page answers 404; if it came back
// as anything the page could not tell apart from an outage, the page would
// render an empty 200 shell — a soft 404, which keeps a dead URL indexed, keeps
// the crawler spending budget on it, and reads the "不存在" copy as thin content
// on a live page.
//
// The mirror-image failure is worse and is pinned here too: reporting a BROKEN
// READ as a miss retires a live tag because a path was renamed.

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
		// The catalog's own miss: the standard envelope + its not-found code,
		// beside the 404. The pairing is what makes it a verdict.
		recordMiss = `{"code":4,"message":"资源不存在"}`
		// A ROUTE-level 404 — the router echoing the status into `code`. It says
		// nothing about this tag, and must not be reported as if it did.
		routeGone = `{"code":404,"message":"Cannot GET /v1/catalog/tagz/11"}`
		// The registry answering, but broken.
		serverDown = `{"code":3,"message":"服务器内部错误"}`
		// A MERGED id: the catalog's 301 verdict, whose data names the survivor.
		// The opposite of a miss — the company exists, under another id.
		recordMoved = `{"code":12,"message":"this id was merged away; use current_id",` +
			`"data":{"entity_type":"label","id":13323,"current_id":6935}}`
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
			// The client never dials for this one — it cannot even parse the id —
			// so the verdict carries no HTTP status to pair with, and is still a
			// miss.
			name:       "an id that is not a number never reaches the catalog, and is still a miss",
			path:       "/api/v1/tag/_?tag_id=abc",
			wantStatus: http.StatusNotFound, wantBodyHas: `"code":40400`,
		},
		{
			// A merged label must FORWARD, not 404. Answering it with the miss
			// above would retire a live company's old URL and drop every inbound
			// link that pointed at the id which lost the merge.
			//
			// Location is set on purpose: net/http follows a 301 by default, and
			// following it here would replay the request and hand back whatever
			// the survivor's URL serves — the survivor's record under the DEAD
			// id. The upstream answers every path with this same body, so a
			// followed redirect would still 301 and the assertion below would
			// see no moved_to.
			name:             "a merged official forwards to its survivor",
			path:             "/api/v1/official/_?official_id=13323",
			upstreamStatus:   http.StatusMovedPermanently,
			upstreamLocation: "/v1/catalog/labels/6935",
			upstreamBody:     recordMoved,
			wantStatus:       http.StatusOK, wantBodyHas: `"moved_to":6935`,
		},
		{
			// The case a status-only test would get wrong: same 404, different
			// body, opposite meaning.
			name:           "an upstream route failure is a failure, not a missing tag",
			path:           "/api/v1/tag/_?tag_id=11",
			upstreamStatus: http.StatusNotFound, upstreamBody: routeGone,
			wantStatus: http.StatusBadRequest,
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

			// service / users nil: every branch under test answers before the
			// handler touches either.
			h := New(nil, galgameClient.NewWithKey(upstream.URL, "nm_test_key"), nil, nil)
			app := fiber.New()
			// Registered under the real prefix: the handler derives the upstream
			// path from c.OriginalURL() minus /api/v1.
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
