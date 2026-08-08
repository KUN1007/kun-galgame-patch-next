package model

import (
	"time"

	"kun-galgame-patch-api/internal/infrastructure/markdown"
)

type Doc struct {
	ID              int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Slug            string    `gorm:"size:255;not null;uniqueIndex" json:"slug"`
	Category        string    `gorm:"size:64;not null;default:''" json:"category"`
	Title           string    `gorm:"size:255;not null;default:''" json:"title"`
	Banner          string    `gorm:"size:512;not null;default:''" json:"banner"`
	BannerImageHash string    `gorm:"column:banner_image_hash;type:char(64);not null;default:''" json:"banner_image_hash"`
	Description     string    `gorm:"type:text;not null;default:''" json:"description"`
	Date            string    `gorm:"size:32;not null;default:''" json:"date"`
	AuthorUID       int       `gorm:"column:author_uid;not null;default:0" json:"author_uid"`
	AuthorName      string    `gorm:"size:255;not null;default:''" json:"author_name"`
	AuthorAvatar    string    `gorm:"size:512;not null;default:''" json:"author_avatar"`
	AuthorHomepage  string    `gorm:"size:512;not null;default:''" json:"author_homepage"`
	Pin             bool      `gorm:"not null;default:false" json:"pin"`
	Content         string    `gorm:"type:text;not null;default:''" json:"content"`
	Status          int       `gorm:"not null;default:1" json:"status"`
	View            int       `gorm:"not null;default:0" json:"view"`
	UserID          int       `gorm:"not null;default:0" json:"user_id"`
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (Doc) TableName() string { return "doc" }

const (
	StatusDraft     = 0
	StatusPublished = 1
)

type Frontmatter struct {
	Title          string `json:"title"`
	Banner         string `json:"banner"`
	Description    string `json:"description"`
	Date           string `json:"date"`
	AuthorUID      int    `json:"author_uid,omitempty"`
	AuthorName     string `json:"author_name"`
	AuthorAvatar   string `json:"author_avatar"`
	AuthorHomepage string `json:"author_homepage,omitempty"`
	Pin            bool   `json:"pin,omitempty"`
}

type PostMetadata struct {
	Title       string `json:"title"`
	Banner      string `json:"banner"`
	Date        string `json:"date"`
	Description string `json:"description"`
	TextCount   int    `json:"text_count"`
	Slug        string `json:"slug"`
	Path        string `json:"path"`
	Directory   string `json:"directory"`
}

type TreeNode struct {
	Name     string     `json:"name"`
	Label    string     `json:"label"`
	Path     string     `json:"path"`
	Type     string     `json:"type"`
	Children []TreeNode `json:"children,omitempty"`
}

type PostsResponse struct {
	Items []PostMetadata `json:"items"`
	Tree  TreeNode       `json:"tree"`
}

type CarouselItem struct {
	Title        string `json:"title"`
	Banner       string `json:"banner"`
	Description  string `json:"description"`
	Date         string `json:"date"`
	Slug         string `json:"slug"`
	Category     string `json:"category"`
	AuthorName   string `json:"author_name"`
	AuthorAvatar string `json:"author_avatar"`
}

type PostDetail struct {
	Slug        string             `json:"slug"`
	HTML        string             `json:"html"`
	TOC         []markdown.TOCItem `json:"toc"`
	Frontmatter Frontmatter        `json:"frontmatter"`
	Prev        *PostMetadata      `json:"prev"`
	Next        *PostMetadata      `json:"next"`
}

type AdminItem struct {
	ID       int64  `json:"id"`
	Category string `json:"category"`
	Slug     string `json:"slug"`
	Name     string `json:"name"`
	Title    string `json:"title"`
	Status   int    `json:"status"`
	Pin      bool   `json:"pin"`
	View     int    `json:"view"`
	Date     string `json:"date"`
	Banner   string `json:"banner"`
}

type AdminDetail struct {
	ID              int64  `json:"id"`
	Category        string `json:"category"`
	Slug            string `json:"slug"`
	Name            string `json:"name"`
	Title           string `json:"title"`
	Description     string `json:"description"`
	Content         string `json:"content"`
	BannerImageHash string `json:"banner_image_hash"`
	Banner          string `json:"banner"`
	Date            string `json:"date"`
	Status          int    `json:"status"`
	Pin             bool   `json:"pin"`
	View            int    `json:"view"`
}
