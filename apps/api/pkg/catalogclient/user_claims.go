// The claim-lifecycle face on the USER-TOKEN plane (wave 182).
//
// Every other call in this package is S2S: HTTP Basic with moyu's OAuth
// client_id/secret, with the end user ASSERTED in the payload (EditActor). The
// user plane inverts that — moyu forwards the logged-in user's OWN OAuth access
// token as a Bearer, and the catalog derives BOTH the acting user and the
// acting site from the token itself:
//
//	S2S  — moyu names the tenant in `site` and asserts the user in `actor`,
//	       and is believed because it authenticated itself.
//	user — the tenant is the token client's catalog_site and the user is the
//	       token's `id` claim. The body has no field for either, so a request
//	       cannot claim to be somebody it is not.
//
// Two consequences worth stating, because they are why this file is separate
// rather than three more helpers in lifecycle.go:
//
//   - The token must carry the `catalog:edit` scope. A session authorized
//     BEFORE the scope existed does not have it and never will — refreshing a
//     token cannot widen a grant. Those users get a 403 that means "log out and
//     back in", not "you are not allowed", which is why it surfaces as its own
//     sentinel (ErrInsufficientScope) rather than folded into a generic denial.
//   - The Basic credential is NOT attached. Sending both would let the service
//     fall back to the S2S posture and silently defeat the point of the move.
//
// What stays on the S2S channel is what makes no claim on any user's behalf:
// the claim-event feed the cron reads, and the per-user counters behind the
// creator thresholds, which are read ABOUT other people and have no token to
// hold.
package catalogclient

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

// userBase is the user-token face's prefix, mounted on the same host as the
// S2S face (KUN_NEXTMOE_API_BASE).
const userBase = "/api/v1/user/catalog"

// ErrInsufficientScope is the one denial the caller can act on: the access
// token is valid but lacks the `catalog:edit` grant, so the fix is a re-login,
// not a permission change.
var ErrInsufficientScope = errors.New("catalogclient: access token lacks the catalog:edit scope")

// ErrNoAccessToken is returned before dialling when the session carries no
// OAuth access token — an anonymous caller reaching a user-plane write.
var ErrNoAccessToken = errors.New("catalogclient: no user access token on this request")

// UserWorkSubmitRequest mints a registry work AS the token's own user. It is
// WorkSubmitRequest minus the two fields the token already answers (site and
// actor) and nothing else moved: Fields is still keyed by the editing face's
// catalog.work field keys, and a work-level release date still travels as
// Released rather than as a field. Covers and screenshots are still not
// accepted here: the bytes are uploaded first and attached as a later edit, or
// a submission would reference bytes nothing else in the registry references.
//
// ProductWorkID stays omittable and moyu still omits it: moyu's local patch id
// IS the shared gid, a key space it does not mint, so the registry allocates
// and moyu adopts the answer.
type UserWorkSubmitRequest struct {
	ProductWorkID int64           `json:"product_work_id,omitempty"`
	Fields        map[string]any  `json:"fields"`
	Released      *WorkSubmitDate `json:"released,omitempty"`
}

// SubmitWorkUser files a new submission as the token's own user.
func (c *Client) SubmitWorkUser(ctx context.Context, accessToken string, req UserWorkSubmitRequest) (*WorkSubmitResult, error) {
	return userPost[WorkSubmitResult](ctx, c, accessToken, userBase+"/works/submit", req)
}

// UserClaimActionRequest is the body of one lifecycle action on the user plane.
// ClaimActionRequest's Site and Actor are both gone.
type UserClaimActionRequest struct {
	// ProductWorkID is read by `claim` alone and ignored by every other action.
	ProductWorkID int64 `json:"product_work_id,omitempty"`
	// Reason is recorded on the event. moyu drives no review action, so it
	// sends this only where the owner half carries a note.
	Reason string `json:"reason,omitempty"`
}

// ActOnClaimUser performs one lifecycle action as the token's own user.
//
// A 409 still carries the claim's CURRENT state and is rendered rather than
// retried — the losing side of a race has already had its answer. A 403 now
// means something the product no longer decides: the token's user does not own
// the entry (and it is not an unowned draft they may adopt).
func (c *Client) ActOnClaimUser(ctx context.Context, accessToken string, workID int64, action string, req UserClaimActionRequest) (*ClaimActionResult, error) {
	return userPost[ClaimActionResult](ctx, c, accessToken,
		userBase+"/works/"+strconv.FormatInt(workID, 10)+"/claim-actions/"+action, req)
}

// MyClaims lists the works the TOKEN's own user has acted on, most recent
// activity first — the same descending cursor page as UserClaims, minus the
// uid.
//
// UserClaimFilter.Site is deliberately NOT sent: the acting tenant comes off
// the token like everything else on this plane, so a site in the query would be
// either redundant or a claim about another tenant.
func (c *Client) MyClaims(ctx context.Context, accessToken string, f UserClaimFilter) (*UserClaimPage, error) {
	q := url.Values{}
	if len(f.ClaimStates) > 0 {
		q.Set("claim_state", strings.Join(f.ClaimStates, ","))
	}
	if f.Before > 0 {
		q.Set("before", strconv.FormatInt(f.Before, 10))
	}
	if f.Limit > 0 {
		q.Set("limit", strconv.Itoa(f.Limit))
	}
	path := userBase + "/claims/mine"
	if len(q) > 0 {
		path += "?" + q.Encode()
	}
	return userDo[UserClaimPage](ctx, c, http.MethodGet, accessToken, path, nil)
}

func userPost[T any](ctx context.Context, c *Client, accessToken, path string, body any) (*T, error) {
	raw, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("encode catalog body: %w", err)
	}
	return userDo[T](ctx, c, http.MethodPost, accessToken, path, raw)
}

// userDo is the user plane's transport: Bearer only, one sentinel for the
// denial a caller must branch on, and the upstream's own wording preserved on
// everything else (a 409 names the claim state, a 400 names the invalid field —
// both are shown to the person who wrote them).
func userDo[T any](ctx context.Context, c *Client, method, accessToken, path string, body []byte) (*T, error) {
	// Only the base URL matters here — this call authenticates with the user's
	// token, not with the client credential Configured() also demands.
	if c.baseURL == "" {
		return nil, ErrNotConfigured
	}
	if accessToken == "" {
		return nil, ErrNoAccessToken
	}
	var reader io.Reader
	if body != nil {
		reader = bytes.NewReader(body)
	}
	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, reader)
	if err != nil {
		return nil, fmt.Errorf("build catalog request %s: %w", path, err)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	req.Header.Set("Accept", "application/json")
	// The Basic credential is deliberately NOT attached: sending both would let
	// the service fall back to the S2S posture and silently undo the move.
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("catalog %s %s: %w", method, path, err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read catalog response: %w", err)
	}
	var env envelope[T]
	// A body that does not parse still has a status worth honouring — a proxy
	// error page in front of a dead service must not read as a filed
	// submission.
	decodeErr := json.Unmarshal(raw, &env)
	if resp.StatusCode == http.StatusForbidden && isScopeDenial(env.Message) {
		return nil, ErrInsufficientScope
	}
	if decodeErr != nil {
		return nil, fmt.Errorf("decode catalog envelope: %w (status=%d)", decodeErr, resp.StatusCode)
	}
	if env.Code != 0 || resp.StatusCode != http.StatusOK {
		return nil, &APIError{Status: resp.StatusCode, Code: env.Code, Message: env.Message}
	}
	return &env.Data, nil
}

// isScopeDenial separates the ONE 403 a user can fix themselves from the ones
// they cannot. The catalog denies a missing scope with the OAuth vocabulary
// ("the access token is missing the catalog:edit scope"); a client or site
// binding problem is an operator's bug and names neither. Matching on the word
// rather than on a numeric code is deliberate: the face publishes the house
// envelope's generic forbidden code for every 403, so the message is the only
// thing that distinguishes them, and a wrong guess here degrades to the generic
// denial rather than to a wrong instruction.
func isScopeDenial(message string) bool {
	return strings.Contains(strings.ToLower(message), "scope")
}
