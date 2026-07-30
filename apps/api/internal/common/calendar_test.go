package common

import (
	"strings"
	"testing"
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
