package catalogv2

import (
	"context"
	"strconv"
)

type ClaimRecord struct {
	Object      string `json:"object"`
	ID          string `json:"id"`
	State       string `json:"state"`
	DisplayName string `json:"display_name"`
}

func (r ClaimRecord) WorkID() int64 {
	id, _ := ParseID(r.ID)
	return id
}

func (c *Client) CreateClaim(ctx context.Context, accessToken string, workID, siteWorkID int64) (*ClaimRecord, error) {
	body := map[string]any{"work_id": FormatID(workID)}
	if siteWorkID > 0 {
		body["site_work_id"] = FormatID(siteWorkID)
	}
	var out ClaimRecord
	if _, err := c.userDo(ctx, "POST", "/v2/me/claims", accessToken, body, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Client) PatchClaim(ctx context.Context, accessToken string, workID int64, state string) (*ClaimRecord, error) {
	if accessToken == "" {
		return nil, ErrNoAccessToken
	}
	var out ClaimRecord
	if _, err := c.do(ctx, "PATCH", "/v2/me/claims/"+FormatID(workID), accessToken, `*`,
		map[string]any{"state": state}, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Client) MergedProposalTotal(ctx context.Context, uid int) (int64, error) {
	if uid <= 0 {
		return 0, nil
	}
	path := "/v2/catalog/proposals?proposer_uid=" + strconv.Itoa(uid) +
		"&state=merged&include_total=true&limit=1"
	var out List[ProposalRecord]
	if err := c.get(ctx, path, &out); err != nil {
		return 0, err
	}
	if out.Total != nil {
		return *out.Total, nil
	}
	return int64(len(out.Items)), nil
}
