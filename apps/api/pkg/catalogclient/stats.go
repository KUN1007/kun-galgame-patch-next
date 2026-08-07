package catalogclient

import (
	"context"
	"net/url"
	"strconv"
)

// Per-user contribution counters, read off a list face that already carries a
// filtered total. There is no per-user stats endpoint in the registry
// and deliberately so: a total under a filter IS the count, and a second
// endpoint computing the same number a second way is how two answers to one
// question appear.
//
// The call asks for limit=1. The page is thrown away; only the total is read.

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

// The published-claims counter that used to sit beside it is gone with wave
// 182: nothing had called it since the creator snapshot settled on merged
// proposals + resources + moemoepoints, and it was the last reader of the S2S
// per-user claims face.
