package model

import "time"

// UserFollowRelation 关注关系
type UserFollowRelation struct {
	ID          int `gorm:"primaryKey;autoIncrement" json:"id"`
	FollowerID  int `gorm:"uniqueIndex:idx_follow;not null" json:"follower_id"`
	FollowingID int `gorm:"uniqueIndex:idx_follow;not null" json:"following_id"`
}

func (UserFollowRelation) TableName() string { return "user_follow_relation" }

// UserMessage 用户消息
type UserMessage struct {
	ID          int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Type        string    `gorm:"not null" json:"type"`
	Content     string    `gorm:"type:varchar(10007)" json:"content"`
	Status      int       `gorm:"default:0" json:"status"`
	Link        string    `gorm:"type:varchar(1007);default:''" json:"link"`
	SenderID    *int      `json:"sender_id"`
	RecipientID *int      `json:"recipient_id"`
	Created     time.Time `gorm:"autoCreateTime" json:"created"`
	Updated     time.Time `gorm:"autoUpdateTime" json:"updated"`
}

func (UserMessage) TableName() string { return "user_message" }

// UserBasic 用户基本信息（用于列表展示）
type UserBasic struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Avatar string `json:"avatar"`
}
