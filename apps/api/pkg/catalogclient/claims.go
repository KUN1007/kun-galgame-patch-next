package catalogclient

import (
	"context"
	"net/url"
	"strconv"
	"time"
)

// The claim-lifecycle feed: the transition log downstream inboxes are built
// from. It is the registry-native replacement for the wiki's message feed, and
// the two are NOT translations of each other — see the cron for what differs.

// ClaimEventFeedItem is one claim transition.
//
// FromState is null exactly once per claim — the transition that created it —
// so a consumer can recognise a birth without a second read. ProductWorkID is
// the claim's CURRENT product-side id (a snapshot taken when the page was
// served, not the value at event time); for a kungal claim that is the gid,
// which is also moyu's own patch id.
//
// Note what is NOT here: a beneficiary. The wiki feed named the user each
// message was FOR (`target_user_id`); this one names the ACTOR, and on an
// approval the actor is the reviewer. Recovering the submitter is the cron's
// job, not a field.
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

// ClaimEventFeedPage is one page of the transition feed. NextSince echoes the
// request's cursor on an empty page, so a consumer that stores it
// unconditionally never rewinds.
type ClaimEventFeedPage struct {
	Items     []ClaimEventFeedItem `json:"items"`
	NextSince int64                `json:"next_since"`
}

// ClaimEventsSince reads one page of the transition feed after the exclusive
// cursor `since`, optionally narrowed to one tenant. Ascending by id, no
// has_more flag: a page shorter than the limit is the tail.
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
