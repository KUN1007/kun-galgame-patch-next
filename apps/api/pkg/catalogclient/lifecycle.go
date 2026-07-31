package catalogclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// The claim-lifecycle WRITE face and the per-user read that pairs with it —
// the registry-native replacement for the wiki's submission surface.
//
// Two vocabularies retire with that surface and are NOT re-declared here: the
// wiki `status` integers (0 published / 1 banned / 2 VNDB draft / 3 pending /
// 4 declined) became the claim states in client.go, which is a reshape and not
// a rename; and the wiki message `type` words, which became transitions.

// Claim actions — the eight semantic moves. The first four are the owning
// site's, the last four a reviewer's. moyu drives three of the owner half; it
// has no review UI at all (wave 159 §3.1 P2).
const (
	ClaimActionClaim    = "claim"
	ClaimActionSubmit   = "submit"
	ClaimActionPublish  = "publish"
	ClaimActionWithdraw = "withdraw"
)

// EditActor is the end user the product backend is acting for. The catalog
// never sees moyu's session; the product asserts the identity and the catalog
// records it.
type EditActor struct {
	UserID int64    `json:"user_id"`
	Roles  []string `json:"roles,omitempty"`
}

// ClaimActionRequest is the body of one lifecycle action. Site is the acting
// tenant and must equal this client's catalog_site binding.
type ClaimActionRequest struct {
	Site  string    `json:"site,omitempty"`
	Actor EditActor `json:"actor"`
	// Reason is recorded on the event. moyu sends it only where the action
	// carries one; withdraw does not require it.
	Reason string `json:"reason,omitempty"`
}

// ClaimActionResult is what the transition did.
type ClaimActionResult struct {
	WorkID  int64   `json:"work_id"`
	From    *string `json:"from_state"`
	To      string  `json:"to_state"`
	EventID int64   `json:"event_id"`
}

// ActOnClaim performs one lifecycle action on a registry work.
//
// An illegal transition surfaces as an *APIError with status 409 naming the
// current state. Callers render it rather than retrying: the losing side of a
// race has already had its answer.
func (c *Client) ActOnClaim(ctx context.Context, workID int64, action string, req ClaimActionRequest) (*ClaimActionResult, error) {
	return post[ClaimActionResult](ctx, c,
		"/api/v1/catalog/works/"+strconv.FormatInt(workID, 10)+"/claim-actions/"+action, req)
}

// WorkSubmitRequest mints a registry work straight into `pending`.
//
// Fields is keyed by the SAME field keys the editing face registers for
// catalog.work, so one schema drives both the submission form and every later
// edit of the same entry. Covers and screenshots are not accepted: the bytes
// are uploaded first and attached as a later edit, or a submission would
// reference bytes nothing else in the registry references yet.
//
// ProductWorkID is omitted, and that is the point. moyu's local patch id IS the
// gid, a key space it shares with kungal and does not mint — so it has no id to
// offer. The registry answers with the work id it just minted and BOTH product
// sites adopt that as their local row's id (161 §6.P4-verdict 1). Sending a
// value here would be claiming an issuing authority moyu does not have.
type WorkSubmitRequest struct {
	Site     string          `json:"site"`
	Actor    EditActor       `json:"actor"`
	Fields   map[string]any  `json:"fields"`
	Released *WorkSubmitDate `json:"released,omitempty"`
}

// WorkSubmitDate is the fuzzy submitted date. The nullable tail IS the
// precision — {Y:2019} means "sometime in 2019" — so an omitted date is TBA.
type WorkSubmitDate struct {
	Y int16 `json:"y"`
	M int16 `json:"m,omitempty"`
	D int16 `json:"d,omitempty"`
}

// WorkSubmitResult is the minted identity plus its birth event. WorkID is the
// id the product site anchors its own row on.
type WorkSubmitResult struct {
	WorkID     int64  `json:"work_id"`
	ClaimState string `json:"claim_state"`
	EventID    int64  `json:"event_id"`
	ReleaseID  int64  `json:"release_id,omitempty"`
}

// SubmitWork files a new submission.
func (c *Client) SubmitWork(ctx context.Context, req WorkSubmitRequest) (*WorkSubmitResult, error) {
	return post[WorkSubmitResult](ctx, c, "/api/v1/catalog/works/submit", req)
}

// UserClaimItem is one work a user has moved through its lifecycle — the
// registry's answer to "my submissions".
//
// The Last* block is the work's latest transition BY ANYONE, not by this user.
// That is the point of it: what a submitter needs on their own submission is
// the reviewer's verdict and note, which is by definition an event they did not
// cause.
type UserClaimItem struct {
	WorkID        int64  `json:"work_id"`
	DisplayName   string `json:"display_name"`
	Site          string `json:"site"`
	ProductWorkID *int64 `json:"product_work_id"`
	ClaimState    string `json:"claim_state"`

	LastEventID   int64     `json:"last_event_id"`
	LastFromState *string   `json:"last_from_state"`
	LastToState   string    `json:"last_to_state"`
	LastReason    *string   `json:"last_reason"`
	LastActorUID  int64     `json:"last_actor_uid"`
	LastEventAt   time.Time `json:"last_event_at"`

	FirstActedAt time.Time `json:"first_acted_at"`
	ActedCount   int       `json:"acted_count"`
}

// UserClaimPage is one DESCENDING cursor page. Total is the count under the
// SAME filter, independent of the cursor.
type UserClaimPage struct {
	Items      []UserClaimItem `json:"items"`
	NextBefore int64           `json:"next_before"`
	Total      int64           `json:"total"`
}

// UserClaimFilter is one page request against the per-user face.
type UserClaimFilter struct {
	// Site restricts to one tenant (empty = every site the user acted on).
	Site string
	// ClaimStates is the public vocabulary filter; empty = every state.
	ClaimStates []string
	// Before is the exclusive cursor (0 = first page).
	Before int64
	Limit  int
}

// UserClaims lists the works a user has acted on, most recent activity first.
func (c *Client) UserClaims(ctx context.Context, uid int, f UserClaimFilter) (*UserClaimPage, error) {
	q := url.Values{}
	if f.Site != "" {
		q.Set("site", f.Site)
	}
	if len(f.ClaimStates) > 0 {
		q.Set("claim_state", strings.Join(f.ClaimStates, ","))
	}
	if f.Before > 0 {
		q.Set("before", strconv.FormatInt(f.Before, 10))
	}
	if f.Limit > 0 {
		q.Set("limit", strconv.Itoa(f.Limit))
	}
	return getQuery[UserClaimPage](ctx, c, "/api/v1/catalog/users/"+strconv.Itoa(uid)+"/claims", q)
}

func post[T any](ctx context.Context, c *Client, path string, body any) (*T, error) {
	if !c.Configured() {
		return nil, ErrNotConfigured
	}
	payload, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("encode catalog body: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+path, bytes.NewReader(payload))
	if err != nil {
		return nil, fmt.Errorf("build catalog request %s: %w", path, err)
	}
	req.Header.Set("Authorization", c.basicAuth)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("catalog POST %s: %w", path, err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read catalog response: %w", err)
	}
	var env envelope[T]
	if err := json.Unmarshal(raw, &env); err != nil {
		return nil, fmt.Errorf("decode catalog envelope: %w (status=%d)", err, resp.StatusCode)
	}
	if env.Code != 0 {
		return nil, &APIError{Status: resp.StatusCode, Code: env.Code, Message: env.Message}
	}
	return &env.Data, nil
}
