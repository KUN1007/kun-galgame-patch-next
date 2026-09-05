package catalogv2

import (
	"context"
	"net/url"
	"strconv"
)

// SearchHit is one row of /v2/catalog/search. Every family answers the same
// shape, so the family it belongs to is on the row rather than in the response.
//
// localized is filled for work, character, credit_name and company only —
// catalog reaches those through their name tables. A tag or a series hit
// carries display_name and nothing else, which is all either of them has.
type SearchHit struct {
	TargetObject string                   `json:"target_object"`
	ID           string                   `json:"id"`
	DisplayName  string                   `json:"display_name"`
	Latin        *string                  `json:"latin"`
	Localized    map[string]LocalizedText `json:"localized"`
	IsSexual     *bool                    `json:"is_sexual"`
}

func (h SearchHit) IntID() (int64, bool) { return ParseID(h.ID) }

type SearchQuery struct {
	// One of work, character, credit_name, company, tag, series, engine, trait.
	// Required: catalog answers 400 without it.
	Object string
	Q      string
	Page   int
	Limit  int
	NSFW   bool
}

// SearchEntities pages by page number, not by keyset: this face's cursor is the
// decimal page it should answer, so PageCursor produces exactly what it wants
// and next_cursor comes back as the next page in the same encoding.
func (c *Client) SearchEntities(ctx context.Context, q SearchQuery) (*List[SearchHit], error) {
	v := url.Values{}
	v.Set("object", q.Object)
	if q.Q != "" {
		v.Set("q", q.Q)
	}
	limit := q.Limit
	if limit <= 0 {
		limit = 20
	}
	v.Set("limit", strconv.Itoa(limit))
	if cursor := PageCursor(q.Page); cursor != "" {
		v.Set("cursor", cursor)
	}
	v.Set("include_total", "true")
	if q.NSFW {
		v.Set("nsfw", "true")
	} else {
		v.Set("nsfw", "false")
	}
	var out List[SearchHit]
	if err := c.get(ctx, "/v2/catalog/search?"+v.Encode(), &out); err != nil {
		return nil, err
	}
	if out.Items == nil {
		out.Items = []SearchHit{}
	}
	return &out, nil
}
