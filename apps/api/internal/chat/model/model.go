// Package model 定义聊天相关的 GORM 模型。
//
// 按 D9（2026-04-21）决策，不再有 WebSocket/Socket.IO，所有读写走 REST。
// 数据表保留原 Prisma schema，只是不再实时推送。
package model

import "time"

// ChatRoom 聊天室（私聊 / 群聊）。
//
//   - Type = "PRIVATE"：私聊，Link 格式为 "{minUid}-{maxUid}"
//   - Type = "GROUP"：群聊，Link 为可分享链接
type ChatRoom struct {
	ID              int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Name            string    `gorm:"type:varchar(107)" json:"name"`
	Link            string    `gorm:"uniqueIndex;type:varchar(17)" json:"link"`
	Avatar          string    `gorm:"type:varchar(1007);default:''" json:"avatar"`
	Type            string    `gorm:"default:'PRIVATE'" json:"type"`
	LastMessageTime time.Time `gorm:"autoCreateTime" json:"last_message_time"`
	Created         time.Time `gorm:"autoCreateTime" json:"created"`
	Updated         time.Time `gorm:"autoUpdateTime" json:"updated"`
}

func (ChatRoom) TableName() string { return "chat_room" }

// ChatMember 聊天室成员。
type ChatMember struct {
	ID         int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Role       string    `gorm:"default:'MEMBER'" json:"role"` // OWNER / ADMIN / MEMBER
	UserID     int       `gorm:"uniqueIndex:idx_user_room;not null" json:"user_id"`
	ChatRoomID int       `gorm:"uniqueIndex:idx_user_room;not null" json:"chat_room_id"`
	Created    time.Time `gorm:"autoCreateTime" json:"created"`
	Updated    time.Time `gorm:"autoUpdateTime" json:"updated"`
}

func (ChatMember) TableName() string { return "chat_member" }

// ChatMessage 聊天消息。
type ChatMessage struct {
	ID          int        `gorm:"primaryKey;autoIncrement" json:"id"`
	Content     string     `gorm:"type:varchar(2000);default:''" json:"content"`
	FileURL     string     `gorm:"type:varchar(1007);default:''" json:"file_url"`
	Status      string     `gorm:"default:'SENT'" json:"status"` // SENT / EDITED / DELETED
	DeletedAt   *time.Time `json:"deleted_at"`
	DeletedByID *int       `json:"deleted_by_id"`
	ChatRoomID  int        `gorm:"index;not null" json:"chat_room_id"`
	SenderID    int        `gorm:"not null" json:"sender_id"`
	ReplyToID   *int       `json:"reply_to_id"`
	Created     time.Time  `gorm:"autoCreateTime" json:"created"`
	Updated     time.Time  `gorm:"autoUpdateTime" json:"updated"`
}

func (ChatMessage) TableName() string { return "chat_message" }

// ChatMessageSeen 消息已读状态（某用户看过某条消息）。
type ChatMessageSeen struct {
	ID            int       `gorm:"primaryKey;autoIncrement" json:"id"`
	ChatMessageID int       `gorm:"uniqueIndex:idx_user_msg_seen;not null" json:"chat_message_id"`
	UserID        int       `gorm:"uniqueIndex:idx_user_msg_seen;not null" json:"user_id"`
	ReadAt        time.Time `gorm:"autoCreateTime" json:"read_at"`
}

func (ChatMessageSeen) TableName() string { return "chat_message_seen" }

// ChatMessageReaction 消息表情回应。
type ChatMessageReaction struct {
	ID            int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Emoji         string    `gorm:"type:varchar(10);uniqueIndex:idx_user_msg_emoji" json:"emoji"`
	ChatMessageID int       `gorm:"uniqueIndex:idx_user_msg_emoji;not null" json:"chat_message_id"`
	UserID        int       `gorm:"uniqueIndex:idx_user_msg_emoji;not null" json:"user_id"`
	Created       time.Time `gorm:"autoCreateTime" json:"created"`
	Updated       time.Time `gorm:"autoUpdateTime" json:"updated"`
}

func (ChatMessageReaction) TableName() string { return "chat_message_reaction" }

// ChatMessageEditHistory 消息编辑历史。
type ChatMessageEditHistory struct {
	ID              int       `gorm:"primaryKey;autoIncrement" json:"id"`
	PreviousContent string    `gorm:"type:varchar(2000)" json:"previous_content"`
	ChatMessageID   int       `gorm:"index;not null" json:"chat_message_id"`
	EditedAt        time.Time `gorm:"autoCreateTime" json:"edited_at"`
}

func (ChatMessageEditHistory) TableName() string { return "chat_message_edit_history" }
