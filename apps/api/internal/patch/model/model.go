package model

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

// JSONArray represents a PostgreSQL jsonb array field
type JSONArray []string

func (j *JSONArray) Scan(value any) error {
	if value == nil {
		*j = JSONArray{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("failed to unmarshal JSONArray: %v", value)
	}
	return json.Unmarshal(bytes, j)
}

func (j JSONArray) Value() (driver.Value, error) {
	if j == nil {
		return "[]", nil
	}
	return json.Marshal(j)
}

// Patch is the main patch table
type Patch struct {
	ID                 int       `gorm:"primaryKey;autoIncrement" json:"id"`
	NameEnUs           string    `gorm:"type:varchar(1007);default:''" json:"name_en_us"`
	NameZhCn           string    `gorm:"type:varchar(1007);default:''" json:"name_zh_cn"`
	NameJaJp           string    `gorm:"type:varchar(1007);default:''" json:"name_ja_jp"`
	VndbID             *string   `gorm:"uniqueIndex;type:varchar(107)" json:"vndb_id"`
	BID                *int      `gorm:"uniqueIndex" json:"bid"`
	Banner             string    `gorm:"type:varchar(1007);default:''" json:"banner"`
	IntroductionZhCn   string    `gorm:"type:varchar(100007);default:''" json:"introduction_zh_cn"`
	IntroductionJaJp   string    `gorm:"type:varchar(100007);default:''" json:"introduction_ja_jp"`
	IntroductionEnUs   string    `gorm:"type:varchar(100007);default:''" json:"introduction_en_us"`
	Released           string    `gorm:"type:varchar(107);default:'unknown'" json:"released"`
	ContentLimit       string    `gorm:"type:varchar(107);default:'sfw'" json:"content_limit"`
	Status             int       `gorm:"default:0" json:"status"`
	Download           int       `gorm:"default:0" json:"download"`
	View               int       `gorm:"default:0" json:"view"`
	ResourceUpdateTime time.Time `gorm:"autoCreateTime" json:"resource_update_time"`
	Type               JSONArray `gorm:"type:jsonb;default:'[]'" json:"type"`
	Language           JSONArray `gorm:"type:jsonb;default:'[]'" json:"language"`
	Engine             JSONArray `gorm:"type:jsonb;default:'[]'" json:"engine"`
	Platform           JSONArray `gorm:"type:jsonb;default:'[]'" json:"platform"`
	FavoriteCount      int       `gorm:"default:0" json:"favorite_count"`
	ContributeCount    int       `gorm:"default:0" json:"contribute_count"`
	CommentCount       int       `gorm:"default:0" json:"comment_count"`
	ResourceCount      int       `gorm:"default:0" json:"resource_count"`
	UserID             int       `gorm:"not null" json:"user_id"`
	Created            time.Time `gorm:"autoCreateTime" json:"created"`
	Updated            time.Time `gorm:"autoUpdateTime" json:"updated"`

	// Relations (for Preload)
	User        *PatchUser       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Aliases     []PatchAlias     `gorm:"foreignKey:PatchID" json:"alias,omitempty"`
	Tags        []PatchTagRel    `gorm:"foreignKey:PatchID" json:"tag,omitempty"`
	Covers      []PatchCover     `gorm:"foreignKey:PatchID" json:"cover,omitempty"`
	Screenshots []PatchScreenshot `gorm:"foreignKey:PatchID" json:"screenshot,omitempty"`
}

func (Patch) TableName() string { return "patch" }

// PatchUser contains brief user info (used for association queries)
type PatchUser struct {
	ID     int    `gorm:"primaryKey" json:"id"`
	Name   string `json:"name"`
	Avatar string `json:"avatar"`
}

func (PatchUser) TableName() string { return "user" }

// PatchResource represents a patch resource
type PatchResource struct {
	ID                    int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Storage               string    `gorm:"not null" json:"storage"`
	Name                  string    `gorm:"type:varchar(300);default:''" json:"name"`
	ModelName             string    `gorm:"type:varchar(1007);default:''" json:"model_name"`
	LocalizationGroupName string    `gorm:"type:varchar(1007);default:''" json:"localization_group_name"`
	Size                  string    `gorm:"type:varchar(107);default:''" json:"size"`
	Code                  string    `gorm:"type:varchar(1007);default:''" json:"code"`
	Password              string    `gorm:"type:varchar(1007);default:''" json:"password"`
	Note                  string    `gorm:"type:varchar(10007);default:''" json:"note"`
	Hash                  string    `gorm:"default:''" json:"hash"`
	Content               string    `gorm:"default:''" json:"content"`
	Type                  JSONArray `gorm:"type:jsonb;default:'[]'" json:"type"`
	Language              JSONArray `gorm:"type:jsonb;default:'[]'" json:"language"`
	Platform              JSONArray `gorm:"type:jsonb;default:'[]'" json:"platform"`
	Download              int       `gorm:"default:0" json:"download"`
	Status                int       `gorm:"default:0" json:"status"`
	UpdateTime            time.Time `gorm:"autoCreateTime" json:"update_time"`
	LikeCount             int       `gorm:"default:0" json:"like_count"`
	UserID                int       `gorm:"not null" json:"user_id"`
	PatchID               int       `gorm:"not null" json:"patch_id"`
	Created               time.Time `gorm:"autoCreateTime" json:"created"`
	Updated               time.Time `gorm:"autoUpdateTime" json:"updated"`

	User *PatchUser `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (PatchResource) TableName() string { return "patch_resource" }

// PatchComment represents a patch comment
type PatchComment struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Content   string    `gorm:"type:varchar(10007);default:''" json:"content"`
	Edit      string    `gorm:"default:''" json:"edit"`
	LikeCount int       `gorm:"default:0" json:"like_count"`
	ParentID  *int      `json:"parent_id"`
	UserID    int       `gorm:"not null" json:"user_id"`
	PatchID   int       `gorm:"not null" json:"patch_id"`
	Created   time.Time `gorm:"autoCreateTime" json:"created"`
	Updated   time.Time `gorm:"autoUpdateTime" json:"updated"`

	User    *PatchUser     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Replies []PatchComment `gorm:"foreignKey:ParentID" json:"reply,omitempty"`
}

func (PatchComment) TableName() string { return "patch_comment" }

// PatchAlias represents a patch alias
type PatchAlias struct {
	ID      int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Name    string    `gorm:"type:varchar(1007);index" json:"name"`
	PatchID int       `gorm:"index;not null" json:"patch_id"`
	Created time.Time `gorm:"autoCreateTime" json:"created"`
	Updated time.Time `gorm:"autoUpdateTime" json:"updated"`
}

func (PatchAlias) TableName() string { return "patch_alias" }

// PatchLink represents an external link
type PatchLink struct {
	ID      int       `gorm:"primaryKey;autoIncrement" json:"id"`
	PatchID int       `gorm:"uniqueIndex:idx_patch_link;index;not null" json:"patch_id"`
	Name    string    `gorm:"uniqueIndex:idx_patch_link;type:varchar(233)" json:"name"`
	URL     string    `gorm:"type:varchar(1007)" json:"url"`
	Created time.Time `gorm:"autoCreateTime" json:"created"`
	Updated time.Time `gorm:"autoUpdateTime" json:"updated"`
}

func (PatchLink) TableName() string { return "patch_link" }

// PatchCover represents a cover image (from VNDB)
type PatchCover struct {
	ID           int       `gorm:"primaryKey;autoIncrement" json:"id"`
	PatchID      int       `gorm:"uniqueIndex:idx_patch_cover;index" json:"patch_id"`
	ImageID      string    `gorm:"uniqueIndex:idx_patch_cover;type:varchar(107);index" json:"image_id"`
	URL          string    `gorm:"type:varchar(1007)" json:"url"`
	Width        int       `json:"width"`
	Height       int       `json:"height"`
	Sexual       float64   `json:"sexual"`
	Violence     float64   `json:"violence"`
	Votecount    int       `json:"votecount"`
	ThumbnailURL string    `gorm:"type:varchar(1007)" json:"thumbnail_url"`
	ThumbWidth   int       `json:"thumb_width"`
	ThumbHeight  int       `json:"thumb_height"`
	Created      time.Time `gorm:"autoCreateTime" json:"created"`
	Updated      time.Time `gorm:"autoUpdateTime" json:"updated"`
}

func (PatchCover) TableName() string { return "patch_cover" }

// PatchScreenshot represents a screenshot (from VNDB)
type PatchScreenshot struct {
	ID           int       `gorm:"primaryKey;autoIncrement" json:"id"`
	PatchID      int       `gorm:"uniqueIndex:idx_patch_screenshot;index" json:"patch_id"`
	ImageID      string    `gorm:"uniqueIndex:idx_patch_screenshot;type:varchar(107);index" json:"image_id"`
	URL          string    `gorm:"type:varchar(1007)" json:"url"`
	Width        int       `json:"width"`
	Height       int       `json:"height"`
	Sexual       float64   `json:"sexual"`
	Violence     float64   `json:"violence"`
	Votecount    int       `json:"votecount"`
	ThumbnailURL string    `gorm:"type:varchar(1007)" json:"thumbnail_url"`
	ThumbWidth   int       `json:"thumb_width"`
	ThumbHeight  int       `json:"thumb_height"`
	OrderNo      int       `gorm:"default:0" json:"order_no"`
	Created      time.Time `gorm:"autoCreateTime" json:"created"`
	Updated      time.Time `gorm:"autoUpdateTime" json:"updated"`
}

func (PatchScreenshot) TableName() string { return "patch_screenshot" }

// Relation tables
type UserPatchFavoriteRelation struct {
	ID      int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID  int       `gorm:"uniqueIndex:idx_user_patch_fav;not null" json:"user_id"`
	PatchID int       `gorm:"uniqueIndex:idx_user_patch_fav;not null" json:"patch_id"`
	Created time.Time `gorm:"autoCreateTime" json:"created"`
	Updated time.Time `gorm:"autoUpdateTime" json:"updated"`
}

func (UserPatchFavoriteRelation) TableName() string { return "user_patch_favorite_relation" }

type UserPatchContributeRelation struct {
	ID      int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID  int       `gorm:"uniqueIndex:idx_user_patch_contrib;not null" json:"user_id"`
	PatchID int       `gorm:"uniqueIndex:idx_user_patch_contrib;not null" json:"patch_id"`
	Created time.Time `gorm:"autoCreateTime" json:"created"`
	Updated time.Time `gorm:"autoUpdateTime" json:"updated"`
}

func (UserPatchContributeRelation) TableName() string { return "user_patch_contribute_relation" }

type UserPatchCommentLikeRelation struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    int       `gorm:"uniqueIndex:idx_user_comment_like;not null" json:"user_id"`
	CommentID int       `gorm:"uniqueIndex:idx_user_comment_like;not null" json:"comment_id"`
	Created   time.Time `gorm:"autoCreateTime" json:"created"`
	Updated   time.Time `gorm:"autoUpdateTime" json:"updated"`
}

func (UserPatchCommentLikeRelation) TableName() string { return "user_patch_comment_like_relation" }

type UserPatchResourceLikeRelation struct {
	ID         int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID     int       `gorm:"uniqueIndex:idx_user_resource_like;not null" json:"user_id"`
	ResourceID int       `gorm:"uniqueIndex:idx_user_resource_like;not null" json:"resource_id"`
	Created    time.Time `gorm:"autoCreateTime" json:"created"`
	Updated    time.Time `gorm:"autoUpdateTime" json:"updated"`
}

func (UserPatchResourceLikeRelation) TableName() string { return "user_patch_resource_like_relation" }

// PatchTagRel represents a tag association (used for Preload)
type PatchTagRel struct {
	ID           int       `gorm:"primaryKey;autoIncrement" json:"id"`
	PatchID      int       `gorm:"uniqueIndex:idx_patch_tag;not null" json:"patch_id"`
	TagID        int       `gorm:"uniqueIndex:idx_patch_tag;not null" json:"tag_id"`
	SpoilerLevel int      `gorm:"default:0" json:"spoiler_level"`
	Created      time.Time `gorm:"autoCreateTime" json:"created"`
	Updated      time.Time `gorm:"autoUpdateTime" json:"updated"`

	Tag *PatchTag `gorm:"foreignKey:TagID" json:"tag,omitempty"`
}

func (PatchTagRel) TableName() string { return "patch_tag_relation" }

// PatchTag represents a tag
type PatchTag struct {
	ID               int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Name             string    `gorm:"type:varchar(107)" json:"name"`
	Provider         string    `gorm:"type:varchar(31);default:''" json:"provider"`
	NameEnUs         string    `gorm:"type:varchar(107);default:''" json:"name_en_us"`
	IntroductionZhCn string    `gorm:"type:varchar(10007);default:''" json:"introduction_zh_cn"`
	IntroductionJaJp string    `gorm:"type:varchar(10007);default:''" json:"introduction_ja_jp"`
	IntroductionEnUs string    `gorm:"type:varchar(10007);default:''" json:"introduction_en_us"`
	Count            int       `gorm:"default:0" json:"count"`
	Alias            JSONArray `gorm:"type:jsonb;default:'[]'" json:"alias"`
	Category         string    `gorm:"default:'sexual'" json:"category"`
	Created          time.Time `gorm:"autoCreateTime" json:"created"`
	Updated          time.Time `gorm:"autoUpdateTime" json:"updated"`
}

func (PatchTag) TableName() string { return "patch_tag" }
