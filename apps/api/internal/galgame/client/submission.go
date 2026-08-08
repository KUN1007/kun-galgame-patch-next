package client

import (
	"context"
	"net/url"
	"strconv"
)

const publishWizardClaimStates = catalogClaimStateLive + "," +
	catalogClaimStateDraft + "," + catalogClaimStatePending

func (c *Client) SearchPublishItems(ctx context.Context, q string, limit int) ([]GalgameHit, int64, error) {
	params := url.Values{}
	if q != "" {
		params.Set("q", q)
	}
	if limit > 0 {
		params.Set("limit", strconv.Itoa(limit))
	}
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
		if !row.ClaimedBy.renderable() || row.ClaimedBy.gid() == 0 {
			continue
		}
		items = append(items, catalogItemToHit(row))
	}
	return items, data.Total, nil
}
