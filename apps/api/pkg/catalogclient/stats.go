package catalogclient

import (
	"context"
	"net/url"
	"strconv"
)

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
