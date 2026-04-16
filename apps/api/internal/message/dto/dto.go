package dto

// GetMessageRequest is the request for fetching messages
type GetMessageRequest struct {
	Type  string `query:"type"`
	Page  int    `query:"page" validate:"required,min=1"`
	Limit int    `query:"limit" validate:"required,min=1,max=30"`
}

// CreateMessageRequest is the request for creating a message
type CreateMessageRequest struct {
	Type        string `json:"type" validate:"required"`
	Content     string `json:"content" validate:"required,max=1007"`
	RecipientID int    `json:"recipient_id" validate:"required,min=1"`
	Link        string `json:"link" validate:"max=1007"`
}

// ReadMessageRequest is the request for marking messages as read
type ReadMessageRequest struct {
	Type string `json:"type" validate:"required,max=20"`
}
