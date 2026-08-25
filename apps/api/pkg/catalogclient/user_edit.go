package catalogclient

const EntityTypeWork = "catalog.work"

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
