package common

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	galgameClient "kun-galgame-patch-api/internal/galgame/client"

	"github.com/gofiber/fiber/v3"
)

// TestCalendarContentLimitsFanOut pins the calendar's fan-out on the EDITING
// axis (doc 106 §38).
//
// The month view merges one response per content_limit, so the values this
// returns are the gate every leg carries — and, because the merge SUMS
// meta.count, they must partition the population rather than overlap it. sfw and
// nsfw do (every entry carries exactly one editing verdict); the age axis this
// lane used to speak did not, which is how a "全部" viewer could be shown a count
// that counted works twice or not at all.
func TestCalendarContentLimitsFanOut(t *testing.T) {
	for _, tc := range []struct {
		cl   string
		want []string
	}{
		{"sfw", []string{"sfw"}},
		{"nsfw", []string{"nsfw"}},
		{"all", []string{"sfw", "nsfw"}},
		{"", []string{"sfw"}},
		{"garbage", []string{"sfw"}},
	} {
		got := calendarContentLimits(tc.cl)
		if strings.Join(got, ",") != strings.Join(tc.want, ",") {
			t.Errorf("calendarContentLimits(%q) = %v, want %v", tc.cl, got, tc.want)
		}
	}
}

// TestCalendarUpstreamFailureMapping pins WHOSE FAULT the calendar reports.
//
// `?month=` rides through to the catalog untouched, so a caller who spells it
// wrongly gets the catalog's own 400 back. moyu used to fold that — and every
// other upstream failure — into 50000「调用 Galgame 资料库失败」, which is a lie
// twice over: it tells the user a healthy service is down, and it throws away
// the one sentence that says which parameter was wrong. A real outage keeps
// that spelling, because then it is true.
func TestCalendarUpstreamFailureMapping(t *testing.T) {
	const (
		// The catalog's own parameter rejection (public_calendar.go:
		// response.BadRequestMsg(c, errors.ErrInvalidParam, "month must be YYYY-MM")).
		badMonth = `{"code":9,"message":"month must be YYYY-MM"}`
		// The registry actually failing.
		serverDown = `{"code":3,"message":"服务器内部错误"}`
	)

	for _, tc := range []struct {
		name           string
		upstreamStatus int
		upstreamBody   string
		wantStatus     int
		wantBodyHas    string
	}{
		{
			name:           "a malformed month is the CALLER's error, and says which",
			upstreamStatus: http.StatusBadRequest, upstreamBody: badMonth,
			wantStatus: http.StatusBadRequest, wantBodyHas: "month must be YYYY-MM",
		},
		{
			name:           "the registry falling over is still a 50000",
			upstreamStatus: http.StatusInternalServerError, upstreamBody: serverDown,
			wantStatus: http.StatusInternalServerError, wantBodyHas: `"code":50000`,
		},
		{
			// Not an envelope at all — a proxy's error page. There is no upstream
			// message to forward and no verdict to trust: an outage.
			name:           "a non-envelope failure is an outage, not a bad request",
			upstreamStatus: http.StatusBadGateway, upstreamBody: `<html>502</html>`,
			wantStatus: http.StatusInternalServerError, wantBodyHas: `"code":50000`,
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(tc.upstreamStatus)
				_, _ = w.Write([]byte(tc.upstreamBody))
			}))
			t.Cleanup(upstream.Close)

			// db / users / artifact / image are nil on purpose: every branch under
			// test returns before the handler reaches any of them, and a nil that
			// never panics is the proof that it does.
			h := NewHandler(nil, galgameClient.NewWithKey(upstream.URL, "nm_test_key"), nil, nil, nil)
			app := fiber.New()
			app.Get("/galgame/calendar", h.GetGalgameCalendar)

			req, _ := http.NewRequest(http.MethodGet, "http://localhost/galgame/calendar?month=2026-7", nil)
			resp, err := app.Test(req)
			if err != nil {
				t.Fatalf("app.Test: %v", err)
			}
			defer resp.Body.Close()
			body, _ := io.ReadAll(resp.Body)

			if resp.StatusCode != tc.wantStatus {
				t.Fatalf("status = %d, want %d (body=%s)", resp.StatusCode, tc.wantStatus, body)
			}
			if !strings.Contains(string(body), tc.wantBodyHas) {
				t.Errorf("body = %s, want it to carry %s", body, tc.wantBodyHas)
			}
		})
	}
}
