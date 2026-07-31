package client

// This file implements the user-submission + admin-review flow described in
// docs/galgame_wiki/07-submission.md and 08-messages.md. The split from
// client.go is purely organizational — all methods belong to *Client.
//
// Two auth modes are at play:
// What is left of it is ONE read. Everything else moved to the registry in wave
// 161 (N5), because the wiki face it proxied to retires with the wiki tables:
//
//   - submit / claim / withdraw are now the registry's claim-lifecycle actions
//     (pkg/catalogclient — Basic auth, not an X-API-Key, since the catalog
//     resolves the caller's site binding from its OAuth client);
//   - "my submissions" and the wizard's own-submissions block are the per-user
//     claim face on the same client;
//   - the cron's message feed became the claim-event feed;
//   - the draft PATCH had no caller left (editing has been an external navigate
//     to kungal for several waves).
//
// No user JWT is forwarded any more either: the registry takes an ASSERTED
// actor from a Basic-authed product backend rather than re-decoding a token,
// so the dual-credential shape went with the write set.

import (
	"context"
	"net/url"
	"strconv"
)

// ─── DTOs ──────────────────────────────────────────────

// publishWizardClaimStates is the population the publish wizard has to see:
// every work a wiki entry claims, published or not. Public browse lanes want
// `live` alone (doc 106 §37) — this is the deliberate exception, because the
// wizard exists to prevent a second submission of something that already
// exists, and an entry it cannot see is an entry that gets submitted twice.
//
// `pending` is asked for even though nothing produces it yet (see
// catalogClaimStatePending). That ordering is the point: the registry's
// projector splits "someone else's submission under review" out of `draft` in
// the W1 window, and if this query only learned the word afterwards, those rows
// would drop out of the wizard's dedup supply for the length of a deploy gap —
// which is exactly the shape that mints duplicate submissions.
const publishWizardClaimStates = catalogClaimStateLive + "," +
	catalogClaimStateDraft + "," + catalogClaimStatePending

// SearchPublishItems answers the registry half of the publish wizard: does this
// game already exist in the catalogue?
//
// The caller's OWN open submissions are a second, separate question with a
// separate supply (the per-user claim face) and the BFF composes the two. They
// were one call while the wiki answered both from one index; they are not the
// same read and never were — this one is a public dedup search, that one is a
// private worklist.
//
// Only the AGE gate is opened — exactly as the wiki lane had it. The wizard is
// a dedup tool for an authenticated submitter, not a browse surface, so
// narrowing its supply by an editorial preference would hide the very entries
// it exists to surface.
func (c *Client) SearchPublishItems(ctx context.Context, q string, limit int) ([]GalgameHit, int64, error) {
	params := url.Values{}
	if q != "" {
		params.Set("q", q)
	}
	if limit > 0 {
		params.Set("limit", strconv.Itoa(limit))
	}
	// claimed=true is the gid requirement: an unclaimed registry row has no
	// wiki id, and every wizard action (关联 / 认领) is keyed by one.
	params.Set("claimed", "true")
	params.Set("claim_state", publishWizardClaimStates)
	params.Set("include", "names,covers,refs")
	gateFor("").apply(params)

	var data catalogWorksSearchData
	if err := c.getV1(ctx, "/catalog/works/search", params, &data); err != nil {
		return nil, 0, err
	}
	items := make([]GalgameHit, 0, len(data.Items))
	for i := range data.Items {
		row := &data.Items[i]
		// A withdrawn claim must never be offered for 认领, and a row with no
		// gid has no action at all. claimed=true should already exclude the
		// latter; this is the same belt the other claim-bearing lanes wear.
		if !row.ClaimedBy.renderable() || row.ClaimedBy.gid() == 0 {
			continue
		}
		items = append(items, catalogItemToHit(row))
	}
	return items, data.Total, nil
}
