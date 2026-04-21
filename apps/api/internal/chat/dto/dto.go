package dto

// ─── Room ───────────────────────────────────────────

// CreateRoomRequest 创建群聊。
type CreateRoomRequest struct {
	Name   string `json:"name" validate:"required,min=1,max=107"`
	Avatar string `json:"avatar" validate:"max=1007"`
}

// JoinRoomRequest 通过链接加入群聊。
type JoinRoomRequest struct {
	Link string `json:"link" validate:"required,min=1,max=17"`
}

// ─── Messages ───────────────────────────────────────

// ListMessagesQuery 轮询拉新消息。
type ListMessagesQuery struct {
	After int `query:"after" validate:"min=0"`        // 上次拉到的最大 message id，0 = 首次
	Limit int `query:"limit" validate:"min=1,max=100"` // 每次最多条数
}

// CreateMessageRequest 发送消息。FileURL 可选（附件）。
type CreateMessageRequest struct {
	Content   string `json:"content" validate:"max=2000"`
	FileURL   string `json:"file_url" validate:"max=1007"`
	ReplyToID *int   `json:"reply_to_id" validate:"omitempty,min=1"`
}

// UpdateMessageRequest 编辑消息。
type UpdateMessageRequest struct {
	Content string `json:"content" validate:"required,min=1,max=2000"`
}

// ReactionRequest 表情回应 toggle。
type ReactionRequest struct {
	Emoji string `json:"emoji" validate:"required,min=1,max=10"`
}

// SeenRequest 批量已读。传 message ids。
type SeenRequest struct {
	MessageIDs []int `json:"message_ids" validate:"required,min=1,max=200,dive,min=1"`
}
