package catalogclient

import (
	"context"
	"net/url"
	"strconv"
	"time"
)

type ClaimEventFeedItem struct {
	ID            int64     `json:"id"`
	WorkID        int64     `json:"work_id"`
	FromState     *string   `json:"from_state"`
	ToState       string    `json:"to_state"`
	ActorUID      int64     `json:"actor_uid"`
	Reason        *string   `json:"reason"`
	Site          string    `json:"site"`
	ProductWorkID *int64    `json:"product_work_id"`
	CreatedAt     time.Time `json:"created_at"`
}

type ClaimEventFeedPage struct {
	Items     []ClaimEventFeedItem `json:"items"`
	NextSince int64                `json:"next_since"`
}

func (c *Client) ClaimEventsSince(ctx context.Context, since int64, limit int, site string) (*ClaimEventFeedPage, error) {
	q := url.Values{
		"since": {strconv.FormatInt(since, 10)},
		"limit": {strconv.Itoa(limit)},
	}
	if site != "" {
		q.Set("site", site)
	}
	return getQuery[ClaimEventFeedPage](ctx, c, "/api/v1/catalog/claim-events/feed", q)
}
