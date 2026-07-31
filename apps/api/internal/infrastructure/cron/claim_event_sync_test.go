package cron

// The claim-event feed is a reshape of the wiki message feed, not a rename, and
// every one of the reshapes below is silent when it is wrong: the wrong branch
// sends the wrong person a notification, or pays twice, or says nothing at all.
// So the mapping is tabled rather than sampled.

import (
	"testing"

	"kun-galgame-patch-api/pkg/catalogclient"
)

func ptr[T any](v T) *T { return &v }

func TestEffectOfMapsEveryTransition(t *testing.T) {
	gid := int64(4242)
	cases := []struct {
		name string
		ev   catalogclient.ClaimEventFeedItem
		want claimEffect
	}{
		{
			// A reviewer approving a submission — the ONE route into live that
			// carries the +3 and the "已通过审核" notice.
			name: "pending → live is an approval",
			ev: catalogclient.ClaimEventFeedItem{
				FromState: ptr(catalogclient.ClaimStatePending),
				ToState:   catalogclient.ClaimStateLive, ProductWorkID: &gid,
			},
			want: claimEffectApproved,
		},
		{
			// The owner publishing their own draft reaches the same destination.
			// moyu already pays for that in the request path under
			// moyu:claim:<gid>; announcing it here would double-pay AND
			// double-notify, and the wiki feed never emitted a message for it.
			name: "draft → live is the owner publishing, already rewarded in-request",
			ev: catalogclient.ClaimEventFeedItem{
				FromState: ptr(catalogclient.ClaimStateDraft),
				ToState:   catalogclient.ClaimStateLive, ProductWorkID: &gid,
			},
			want: claimEffectNone,
		},
		{
			name: "hidden → live is an unban",
			ev: catalogclient.ClaimEventFeedItem{
				FromState: ptr(catalogclient.ClaimStateHidden),
				ToState:   catalogclient.ClaimStateLive, ProductWorkID: &gid,
			},
			want: claimEffectUnbanned,
		},
		{
			// FromState is null exactly once per claim: its birth. A claim born
			// straight into live is an import, and nobody submitted it.
			name: "birth into live is an import, not a verdict",
			ev: catalogclient.ClaimEventFeedItem{
				ToState: catalogclient.ClaimStateLive, ProductWorkID: &gid,
			},
			want: claimEffectNone,
		},
		{
			name: "declined",
			ev: catalogclient.ClaimEventFeedItem{
				FromState: ptr(catalogclient.ClaimStatePending),
				ToState:   catalogclient.ClaimStateDeclined, ProductWorkID: &gid,
			},
			want: claimEffectDeclined,
		},
		{
			name: "hidden is a ban",
			ev: catalogclient.ClaimEventFeedItem{
				FromState: ptr(catalogclient.ClaimStateLive),
				ToState:   catalogclient.ClaimStateHidden, ProductWorkID: &gid,
			},
			want: claimEffectBanned,
		},
		{
			name: "pending records the submitter",
			ev: catalogclient.ClaimEventFeedItem{
				FromState: ptr(catalogclient.ClaimStateDraft),
				ToState:   catalogclient.ClaimStatePending, ProductWorkID: &gid,
			},
			want: claimEffectRememberSubmitter,
		},
		{
			// A withdrawal is reversible and was never a judgement of anyone's
			// submission. The wiki feed had no message type for it either.
			name: "live → draft is a withdrawal, nothing to announce",
			ev: catalogclient.ClaimEventFeedItem{
				FromState: ptr(catalogclient.ClaimStateLive),
				ToState:   catalogclient.ClaimStateDraft, ProductWorkID: &gid,
			},
			want: claimEffectNone,
		},
		{
			// moyu's key space is the gid. A registry-only claim has no id in it,
			// and taking the work id for one would link the notification — and
			// the moemoepoint ref — to a different game (doc 106 R3).
			name: "no product anchor means nothing local to say",
			ev: catalogclient.ClaimEventFeedItem{
				FromState: ptr(catalogclient.ClaimStatePending),
				ToState:   catalogclient.ClaimStateLive,
			},
			want: claimEffectNone,
		},
		{
			// A state this build does not know must be loud, not ignored: it
			// means the registry grew a transition and this cron has an opinion
			// about it that nobody wrote down.
			name: "an unrecognised destination is reported",
			ev: catalogclient.ClaimEventFeedItem{
				ToState: "quarantined", ProductWorkID: &gid,
			},
			want: claimEffectUnknownState,
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := effectOf(&tc.ev); got != tc.want {
				t.Errorf("effectOf = %d, want %d", got, tc.want)
			}
		})
	}
}

// The claim site is renamed mid-window in a step moyu does not deploy with, so
// the tenant filter has to accept both spellings — and reject everyone else's,
// because a foreign tenant's product_work_id is not a gid.
func TestGIDClaimSiteAcceptsBothSpellings(t *testing.T) {
	for _, site := range []string{"kungal", "galgame_wiki"} {
		if !catalogclient.IsGIDClaimSite(site) {
			t.Errorf("site %q must be recognised; on the wrong side of the rename "+
				"the cron would consume every transition and apply none", site)
		}
	}
	for _, site := range []string{"moyu", "letmoe-staging", ""} {
		if catalogclient.IsGIDClaimSite(site) {
			t.Errorf("site %q is not the gid key space and must not be acted on", site)
		}
	}
}
