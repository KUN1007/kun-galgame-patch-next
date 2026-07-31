package catalogclient

import (
	"context"
	"net/url"
	"strconv"
)

// Per-user contribution counters, read off the two list faces that already
// carry a filtered total. There is no per-user stats endpoint in the registry
// and deliberately so: a total under a filter IS the count, and a second
// endpoint computing the same number a second way is how two answers to one
// question appear.
//
// Both calls ask for limit=1. The page is thrown away; only the total is read.

// MergedProposalTotal counts a user's MERGED edit proposals — the registry's
// successor to the wiki's merged-PR tally.
//
// The `total` here is what wave 162 added to this face for exactly this
// question. Before it, the face returned one page and no count, so a threshold
// comparison against it silently read "however many fit on a page".
func (c *Client) MergedProposalTotal(ctx context.Context, uid int) (int64, error) {
	page, err := getQuery[proposalListPage](ctx, c, "/api/v1/catalog/edit/proposals", url.Values{
		"proposer_uid": {strconv.Itoa(uid)},
		"status":       {"merged"},
		"limit":        {"1"},
	})
	if err != nil {
		return 0, err
	}
	return page.Total, nil
}

type proposalListPage struct {
	Total int64 `json:"total"`
}

// PublishedClaimTotal counts the works a user has moved that are currently
// live — "how many entries has this person got published".
//
// Scoped to one site: the per-user face spans every tenant a user has acted on,
// and moyu's thresholds are about the galgame product it shares with kungal.
func (c *Client) PublishedClaimTotal(ctx context.Context, uid int, site string) (int64, error) {
	q := url.Values{
		"claim_state": {ClaimStateLive},
		"limit":       {"1"},
	}
	if site != "" {
		q.Set("site", site)
	}
	page, err := getQuery[userClaimPage](ctx, c, "/api/v1/catalog/users/"+strconv.Itoa(uid)+"/claims", q)
	if err != nil {
		return 0, err
	}
	return page.Total, nil
}

type userClaimPage struct {
	Total int64 `json:"total"`
}
