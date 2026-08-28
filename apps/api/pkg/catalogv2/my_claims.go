package catalogv2

import (
	"context"
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

type MyClaimsQuery struct {
	ClaimStates []string
	Site        string
	Cursor      string
	Limit       int
}

func (c *Client) MyClaims(ctx context.Context, accessToken string, q MyClaimsQuery) (*List[ClaimRecord], error) {
	v := url.Values{"include_total": {"true"}}
	if len(q.ClaimStates) > 0 {
		v.Set("claim_state", strings.Join(q.ClaimStates, ","))
	}
	if q.Site != "" {
		v.Set("site", q.Site)
	}
	if q.Cursor != "" {
		v.Set("cursor", q.Cursor)
	}
	if q.Limit > 0 {
		v.Set("limit", strconv.Itoa(q.Limit))
	}
	var out List[ClaimRecord]
	if _, err := c.userDo(ctx, http.MethodGet, "/v2/me/claims?"+v.Encode(), accessToken, nil, &out); err != nil {
		return nil, err
	}
	if out.Items == nil {
		out.Items = []ClaimRecord{}
	}
	return &out, nil
}
