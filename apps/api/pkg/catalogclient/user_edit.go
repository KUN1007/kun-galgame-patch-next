package catalogclient

import (
	"context"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

const EntityTypeWork = "catalog.work"

type EditProposal struct {
	ID              int64          `json:"id"`
	EntityType      string         `json:"entity_type"`
	EntityID        int64          `json:"entity_id"`
	BaseRevisionSeq int            `json:"base_revision_seq"`
	Patch           map[string]any `json:"patch"`
	ProposerUID     int64          `json:"proposer_uid"`
	Note            string         `json:"note"`
	Site            string         `json:"site"`
	Status          string         `json:"status"`
	DecisionNote    string         `json:"decision_note,omitempty"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
}

type EditRevision struct {
	ID            int64          `json:"id"`
	Seq           int            `json:"seq"`
	Action        string         `json:"action"`
	ChangedFields []string       `json:"changed_fields"`
	Snapshot      map[string]any `json:"snapshot"`
	ActorUID      int64          `json:"actor_uid"`
	AmenderUID    *int64         `json:"amender_uid,omitempty"`
	ProposalID    *int64         `json:"proposal_id,omitempty"`
	Site          string         `json:"site"`
	CreatedAt     time.Time      `json:"created_at"`
}

// Mirrors the catalog edit-schema wire field-for-field (dto.EditSchemaFieldView
// upstream). The bootstrap face re-encodes these verbatim for the page, so a key
// missing here is a key SchemaForm never sees: letmoe shipped a seven-key
// version that silently dropped deprecated/max_elements/max_suppressed on the
// way out.
type EditSchemaField struct {
	Key            string `json:"key"`
	Kind           string `json:"kind"`
	DiffHint       string `json:"diff_hint"`
	Deprecated     bool   `json:"deprecated,omitempty"`
	Locked         bool   `json:"locked"`
	CanPropose     bool   `json:"can_propose"`
	CanReview      bool   `json:"can_review"`
	WouldAutomerge bool   `json:"would_automerge"`
	MaxSuppressed  int    `json:"max_suppressed,omitempty"`
	MaxElements    int    `json:"max_elements,omitempty"`
}

type EditSchema struct {
	EntityType string            `json:"entity_type"`
	Fields     []EditSchemaField `json:"fields"`
}

type EditSnapshot struct {
	EntityType string         `json:"entity_type"`
	EntityID   int64          `json:"entity_id"`
	Values     map[string]any `json:"values"`
}

type EditCreateResult struct {
	Proposal EditProposal  `json:"proposal"`
	Merged   bool          `json:"merged"`
	Revision *EditRevision `json:"revision,omitempty"`
}

type UserEditCreateRequest struct {
	EntityType string         `json:"entity_type"`
	EntityID   int64          `json:"entity_id"`
	Patch      map[string]any `json:"patch"`
	Note       string         `json:"note,omitempty"`
}

func (c *Client) GetEditSchemaUser(ctx context.Context, accessToken, entityType string, entityID int64) (*EditSchema, error) {
	q := url.Values{"entity_id": {strconv.FormatInt(entityID, 10)}}
	return userDo[EditSchema](ctx, c, http.MethodGet, accessToken,
		userBase+"/edit/schema/"+entityType+"?"+q.Encode(), nil)
}

func (c *Client) GetEditSnapshotUser(ctx context.Context, accessToken, entityType string, entityID int64) (*EditSnapshot, error) {
	q := url.Values{
		"entity_type": {entityType},
		"entity_id":   {strconv.FormatInt(entityID, 10)},
	}
	return userDo[EditSnapshot](ctx, c, http.MethodGet, accessToken,
		userBase+"/edit/snapshot?"+q.Encode(), nil)
}

func (c *Client) CreateEditProposalUser(ctx context.Context, accessToken string, req UserEditCreateRequest) (*EditCreateResult, error) {
	return userPost[EditCreateResult](ctx, c, accessToken, userBase+"/edit/proposals", req)
}

func (c *Client) WithdrawEditProposalUser(ctx context.Context, accessToken string, id int64) (*EditProposal, error) {
	return userDo[EditProposal](ctx, c, http.MethodPost, accessToken,
		userBase+"/edit/proposals/"+strconv.FormatInt(id, 10)+"/withdraw", nil)
}

func (c *Client) MyEditProposals(ctx context.Context, accessToken, entityType string, entityID int64, status string, limit int) ([]EditProposal, error) {
	q := url.Values{
		"entity_type": {entityType},
		"mine":        {"true"},
	}
	if entityID > 0 {
		q.Set("entity_id", strconv.FormatInt(entityID, 10))
	}
	if status != "" {
		q.Set("status", status)
	}
	if limit > 0 {
		q.Set("limit", strconv.Itoa(limit))
	}
	page, err := userDo[struct {
		Items []EditProposal `json:"items"`
		Total int64          `json:"total"`
	}](ctx, c, http.MethodGet, accessToken, userBase+"/edit/proposals?"+q.Encode(), nil)
	if err != nil {
		return nil, err
	}
	return page.Items, nil
}
