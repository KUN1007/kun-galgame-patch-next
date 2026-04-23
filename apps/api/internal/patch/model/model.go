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

// Patch 是本项目核心表。
//
// D12（2026-04-21）：几乎所有游戏元数据（name / introduction / banner / released /
// content_limit / engine / alias）都迁到 Galgame Wiki。Patch 只保留：
//   - 与 Wiki 的外键：vndb_id（必填）、galgame_id（Wiki 里的 id，方便批量富化）
//   - 补丁自身数据：翻译类型 / 支持语言 / 平台 / 计数 / 用户
//
// 展示游戏名/封面/介绍时，通过 galgame_id 调 Wiki /galgame/batch 批量拉取。
type Patch struct {
	ID                 int       `gorm:"primaryKey;autoIncrement" json:"id"`
	VndbID             string    `gorm:"uniqueIndex;type:varchar(107);not null" json:"vndb_id"`
	GalgameID          int       `gorm:"index;not null" json:"galgame_id"`
	BID                *int      `gorm:"uniqueIndex" json:"bid"`
	Status             int       `gorm:"default:0" json:"status"`
	Download           int       `gorm:"default:0" json:"download"`
	View               int       `gorm:"default:0" json:"view"`
	ResourceUpdateTime time.Time `gorm:"autoCreateTime" json:"resource_update_time"`
	Type               JSONArray `gorm:"type:jsonb;default:'[]'" json:"type"`
	Language           JSONArray `gorm:"type:jsonb;default:'[]'" json:"language"`
	Platform           JSONArray `gorm:"type:jsonb;default:'[]'" json:"platform"`
	FavoriteCount      int       `gorm:"default:0" json:"favorite_count"`
	ContributeCount    int       `gorm:"default:0" json:"contribute_count"`
	CommentCount       int       `gorm:"default:0" json:"comment_count"`
	ResourceCount      int       `gorm:"default:0" json:"resource_count"`
	UserID             int       `gorm:"not null" json:"user_id"`
	Created            time.Time `gorm:"autoCreateTime" json:"created"`
	Updated            time.Time `gorm:"autoUpdateTime" json:"updated"`

	// Relations（仅 Preload 用，不对应真实列）
	User *PatchUser `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (Patch) TableName() string { return "patch" }

// PatchUser contains brief user info (used for association queries)
type PatchUser struct {
	ID     int    `gorm:"primaryKey" json:"id"`
	Name   string `json:"name"`
	Avatar string `json:"avatar"`
}

func (PatchUser) TableName() string { return "user" }

// PatchResource represents a patch resource.
//
// D10 变更（2026-04-21）：
//   - 老字段 Hash（BLAKE3）改名为 Blake3，仅保留存量数据，新上传恒为 ""
//   - 新增 S3Key：完整 S3 对象键，例如 "patch/42/xk9z.../game.zip"，
//     所有 Put/Head/Delete 操作直接用它，不再应用层拼路径。
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
	Blake3                string    `gorm:"default:''" json:"blake3"`
	S3Key                 string    `gorm:"type:varchar(2048);default:''" json:"s3_key"`
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

// NOTE: PatchAlias 按 D12（2026-04-21）废弃。游戏别名由 Wiki /galgame/:gid/aliases 管理。

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

// NOTE: PatchCover / PatchScreenshot 按 D8 决策废弃，
// 由 Galgame Wiki Service 统一管理，不在本项目落库。

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

// NOTE: PatchTag / PatchTagRel 按 D11（2026-04-21）废弃。
// tag 元数据统一由 Galgame Wiki 管理，通过 patch.vndb_id → Wiki /galgame/batch 获取。
