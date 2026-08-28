package catalogv2

import (
	"context"
	"net/http"
)

const (
	ClaimStateNone     = "none"
	ClaimStateLive     = "live"
	ClaimStateDraft    = "draft"
	ClaimStatePending  = "pending"
	ClaimStateDeclined = "declined"
	ClaimStateHidden   = "hidden"
)

// PATCH /v2/me/claims/{id} takes a transition target, not a claim state: draft
// is the older spelling of the same executor action and both still answer.
const ClaimTargetWithdrawn = "withdrawn"

// moyu's OAuth client carries catalog_site=kungal, so the claims it writes and
// the events it reads are recorded under that tenant and their product_work_id
// is a moyu patch id. Wave 161 renamed the only other value the column has ever
// held (galgame_wiki → kungal).
const SiteKungal = "kungal"

const EntityTypeWork = "catalog.work"

type ClaimEventRef struct {
	Object    string  `json:"object"`
	ID        string  `json:"id"`
	FromState *string `json:"from_state"`
	ToState   string  `json:"to_state"`
	Reason    *string `json:"reason"`
	ActorUID  string  `json:"actor_uid"`
	CreatedAt string  `json:"created_at"`
}

type ClaimRecord struct {
	Object        string         `json:"object"`
	ID            string         `json:"id"`
	State         string         `json:"state"`
	DisplayName   string         `json:"display_name"`
	Site          string         `json:"site"`
	ProductWorkID *string        `json:"product_work_id"`
	LastEvent     *ClaimEventRef `json:"last_event"`
	FirstActedAt  *string        `json:"first_acted_at"`
	ActedCount    *int           `json:"acted_count"`
}

func (r ClaimRecord) WorkID() int64 {
	id, _ := ParseID(r.ID)
	return id
}

func (r ClaimRecord) ProductID() *int64 {
	if r.ProductWorkID == nil {
		return nil
	}
	id, ok := ParseID(*r.ProductWorkID)
	if !ok {
		return nil
	}
	return &id
}

func (r ClaimRecord) LastReason() *string {
	if r.LastEvent == nil {
		return nil
	}
	return r.LastEvent.Reason
}

func (c *Client) CreateClaim(ctx context.Context, accessToken string, workID, siteWorkID int64) (*ClaimRecord, error) {
	body := map[string]any{"work_id": FormatID(workID)}
	if siteWorkID > 0 {
		body["site_work_id"] = FormatID(siteWorkID)
	}
	var out ClaimRecord
	if _, err := c.userDo(ctx, http.MethodPost, "/v2/me/claims", accessToken, body, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// The map's catalog.work.display_name is only a seed: applyTitles runs after
// olang inside the same transaction and rewrites the row to the official title
// in that language, so the wizard's zh-Hans name with olang=ja is born under the
// Japanese title. That was v1's behaviour too; sending display_name at the top
// level instead would pin the seed and change it.
func (c *Client) MintClaim(ctx context.Context, accessToken string, fieldValues map[string]any) (*ClaimRecord, error) {
	var out ClaimRecord
	if _, err := c.userDo(ctx, http.MethodPost, "/v2/me/claims", accessToken,
		map[string]any{"field_values": fieldValues}, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Client) PatchClaim(ctx context.Context, accessToken string, workID int64, state string) (*ClaimRecord, error) {
	if accessToken == "" {
		return nil, ErrNoAccessToken
	}
	var out ClaimRecord
	if _, err := c.do(ctx, http.MethodPatch, "/v2/me/claims/"+FormatID(workID), accessToken, `*`,
		map[string]any{"state": state}, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
