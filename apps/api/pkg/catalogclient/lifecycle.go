package catalogclient

import "time"

// The claim-lifecycle vocabulary and wire shapes — the registry-native
// replacement for the wiki's submission surface. The human WRITES that used to
// live here moved to the user-token plane in user_claims.go, and the S2S
// per-user read left with them (its last caller was the "mine" list, which is
// now /claims/mine); what remains is the vocabulary both planes share.
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

// ClaimActionResult is what the transition did.
type ClaimActionResult struct {
	WorkID  int64   `json:"work_id"`
	From    *string `json:"from_state"`
	To      string  `json:"to_state"`
	EventID int64   `json:"event_id"`
}

// The submission's own request shape is UserWorkSubmitRequest in user_claims.go:
// the S2S one asserted a `site` and an `actor` and is gone rather than kept as a
// second way in. The two types below are shared by both planes because they
// describe the entry, not the caller.

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
//
// There is no Site: the only caller left is MyClaims on the user plane, where
// the tenant comes off the token and a site in the query would be either
// redundant or a claim about another tenant.
type UserClaimFilter struct {
	// ClaimStates is the public vocabulary filter; empty = every state.
	ClaimStates []string
	// Before is the exclusive cursor (0 = first page).
	Before int64
	Limit  int
}

// The S2S per-user read (GET /catalog/users/{uid}/claims) has no caller in moyu
// any more and is gone with wave 182: "my submissions" moved to /claims/mine on
// the user plane, and the creator-stats helper that was the only other reader
// of that face had already fallen out of use. moyu asks the registry nothing
// about a THIRD person's claims — the profile pages that do are kungal's.
