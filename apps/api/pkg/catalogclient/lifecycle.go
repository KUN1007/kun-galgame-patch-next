package catalogclient

import "time"

const (
	ClaimActionClaim    = "claim"
	ClaimActionSubmit   = "submit"
	ClaimActionPublish  = "publish"
	ClaimActionWithdraw = "withdraw"
)

type ClaimActionResult struct {
	WorkID  int64   `json:"work_id"`
	From    *string `json:"from_state"`
	To      string  `json:"to_state"`
	EventID int64   `json:"event_id"`
}

type WorkSubmitDate struct {
	Y int16 `json:"y"`
	M int16 `json:"m,omitempty"`
	D int16 `json:"d,omitempty"`
}

type WorkSubmitResult struct {
	WorkID     int64  `json:"work_id"`
	ClaimState string `json:"claim_state"`
	EventID    int64  `json:"event_id"`
	ReleaseID  int64  `json:"release_id,omitempty"`
}

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

type UserClaimPage struct {
	Items      []UserClaimItem `json:"items"`
	NextBefore int64           `json:"next_before"`
	Total      int64           `json:"total"`
}

type UserClaimFilter struct {
	ClaimStates []string
	Before      int64
	Limit       int
}
