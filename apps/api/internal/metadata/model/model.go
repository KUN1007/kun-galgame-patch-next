package model

import (
	"kun-galgame-patch-api/internal/patch/model"
	"time"
)

// PatchCompany represents a game company
type PatchCompany struct {
	ID               int             `gorm:"primaryKey;autoIncrement" json:"id"`
	Name             string          `gorm:"type:varchar(107)" json:"name"`
	Logo             string          `gorm:"type:varchar(1007);default:''" json:"logo"`
	Introduction     string          `gorm:"type:varchar(10007);default:''" json:"introduction"`
	IntroductionZhCn string          `gorm:"type:varchar(10007);default:''" json:"introduction_zh_cn"`
	IntroductionJaJp string          `gorm:"type:varchar(10007);default:''" json:"introduction_ja_jp"`
	IntroductionEnUs string          `gorm:"type:varchar(10007);default:''" json:"introduction_en_us"`
	Count            int             `gorm:"default:0" json:"count"`
	PrimaryLanguage  model.JSONArray `gorm:"type:jsonb;default:'[]'" json:"primary_language"`
	OfficialWebsite  model.JSONArray `gorm:"type:jsonb;default:'[]'" json:"official_website"`
	ParentBrand      model.JSONArray `gorm:"type:jsonb;default:'[]'" json:"parent_brand"`
	Alias            model.JSONArray `gorm:"type:jsonb;default:'[]'" json:"alias"`
	Created          time.Time       `gorm:"autoCreateTime" json:"created"`
	Updated          time.Time       `gorm:"autoUpdateTime" json:"updated"`
}

func (PatchCompany) TableName() string { return "patch_company" }

// PatchCompanyRelation is the join table between patches and companies
type PatchCompanyRelation struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	PatchID   int       `gorm:"uniqueIndex:idx_patch_company;not null" json:"patch_id"`
	CompanyID int       `gorm:"uniqueIndex:idx_patch_company;not null" json:"company_id"`
	Created   time.Time `gorm:"autoCreateTime" json:"created"`
	Updated   time.Time `gorm:"autoUpdateTime" json:"updated"`
}

func (PatchCompanyRelation) TableName() string { return "patch_company_relation" }

// NOTE: PatchChar / PatchPerson / PatchRelease 等 Galgame 元数据模型按 D8 决策废弃，
// 所有数据统一从 Galgame Wiki Service 获取，不再在本项目落库。
