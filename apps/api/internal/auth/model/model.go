package model

import "time"

// User 用户主表
type User struct {
	ID              int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Name            string    `gorm:"uniqueIndex;type:varchar(17);not null" json:"name"`
	Email           string    `gorm:"uniqueIndex;type:varchar(1007);not null" json:"email"`
	Password        string    `gorm:"type:varchar(1007);not null" json:"-"`
	IP              string    `gorm:"type:varchar(233);default:''" json:"-"`
	Avatar          string    `gorm:"type:varchar(233);default:''" json:"avatar"`
	Role            int       `gorm:"default:1" json:"role"`
	Status          int       `gorm:"default:0" json:"status"`
	RegisterTime    time.Time `gorm:"autoCreateTime" json:"register_time"`
	Moemoepoint     int       `gorm:"default:0" json:"moemoepoint"`
	Bio             string    `gorm:"type:varchar(107);default:''" json:"bio"`
	DailyImageCount int       `gorm:"default:0" json:"-"`
	DailyCheckIn    int       `gorm:"default:0" json:"-"`
	DailyUploadSize int       `gorm:"default:0" json:"-"`
	LastLoginTime   string    `gorm:"default:''" json:"-"`
	FollowerCount   int       `gorm:"default:0" json:"follower_count"`
	FollowingCount  int       `gorm:"default:0" json:"following_count"`
	Created         time.Time `gorm:"autoCreateTime" json:"created"`
	Updated         time.Time `gorm:"autoUpdateTime" json:"updated"`
}

func (User) TableName() string { return "user" }

// OAuthAccount OAuth 关联
type OAuthAccount struct {
	ID       int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID   int       `gorm:"index;not null" json:"user_id"`
	Provider string    `gorm:"type:varchar(50);default:'kun-oauth'" json:"provider"`
	Sub      string    `gorm:"uniqueIndex;type:varchar(255);not null" json:"sub"`
	Created  time.Time `gorm:"autoCreateTime" json:"created"`
	Updated  time.Time `gorm:"autoUpdateTime" json:"updated"`
}

func (OAuthAccount) TableName() string { return "oauth_account" }
