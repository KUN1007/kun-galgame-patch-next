package cron

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
			name: "pending → live is an approval",
			ev: catalogclient.ClaimEventFeedItem{
				FromState: ptr(catalogclient.ClaimStatePending),
				ToState:   catalogclient.ClaimStateLive, ProductWorkID: &gid,
			},
			want: claimEffectApproved,
		},
		{
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
			name: "live → draft is a withdrawal, nothing to announce",
			ev: catalogclient.ClaimEventFeedItem{
				FromState: ptr(catalogclient.ClaimStateLive),
				ToState:   catalogclient.ClaimStateDraft, ProductWorkID: &gid,
			},
			want: claimEffectNone,
		},
		{
			name: "no product anchor means nothing local to say",
			ev: catalogclient.ClaimEventFeedItem{
				FromState: ptr(catalogclient.ClaimStatePending),
				ToState:   catalogclient.ClaimStateLive,
			},
			want: claimEffectNone,
		},
		{
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
