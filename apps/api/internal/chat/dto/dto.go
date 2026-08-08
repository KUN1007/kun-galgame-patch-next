package dto

type CreateRoomRequest struct {
	Name   string `json:"name" validate:"required,min=1,max=107"`
	Avatar string `json:"avatar" validate:"max=1007"`
}

type JoinRoomRequest struct {
	Link string `json:"link" validate:"required,min=1,max=17"`
}

type StartPrivateChatRequest struct {
	PeerUID int `json:"peer_uid" validate:"required,min=1"`
}

type ListMessagesQuery struct {
	IDs    string `query:"ids" validate:"omitempty,max=2000"`
	After  int    `query:"after" validate:"min=0"`
	Before int    `query:"before" validate:"min=0"`
	Limit  int    `query:"limit" validate:"omitempty,min=1,max=100"`
}

type CreateMessageRequest struct {
	Content   string `json:"content" validate:"max=2000"`
	FileURL   string `json:"file_url" validate:"max=1007"`
	ReplyToID *int   `json:"reply_to_id" validate:"omitempty,min=1"`
}

type UpdateMessageRequest struct {
	Content string `json:"content" validate:"required,min=1,max=2000"`
}

type ReactionRequest struct {
	Emoji string `json:"emoji" validate:"required,min=1,max=10"`
}

type SeenRequest struct {
	MessageIDs []int `json:"message_ids" validate:"required,min=1,max=200,dive,min=1"`
}
