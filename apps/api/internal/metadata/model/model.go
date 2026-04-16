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

// PatchChar represents a character
type PatchChar struct {
	ID                 int             `gorm:"primaryKey;autoIncrement" json:"id"`
	Image              string          `gorm:"type:varchar(1007);default:''" json:"image"`
	Gender             string          `gorm:"default:'unknown'" json:"gender"`
	Roles              model.JSONArray `gorm:"type:jsonb;default:'[]'" json:"roles"`
	Role               string          `gorm:"default:'side'" json:"role"`
	Birthday           string          `gorm:"default:''" json:"birthday"`
	Bust               int             `gorm:"default:0" json:"bust"`
	Waist              int             `gorm:"default:0" json:"waist"`
	Hips               int             `gorm:"default:0" json:"hips"`
	Height             int             `gorm:"default:0" json:"height"`
	Weight             int             `gorm:"default:0" json:"weight"`
	Cup                string          `gorm:"default:''" json:"cup"`
	Age                int             `gorm:"default:0" json:"age"`
	Infobox            string          `gorm:"default:''" json:"infobox"`
	VndbCharID         *string         `gorm:"uniqueIndex;type:varchar(32)" json:"vndb_char_id"`
	BangumiCharacterID *int            `gorm:"uniqueIndex" json:"bangumi_character_id"`
	NameZhCn           string          `gorm:"type:varchar(1007);default:''" json:"name_zh_cn"`
	NameJaJp           string          `gorm:"type:varchar(1007);default:''" json:"name_ja_jp"`
	NameEnUs           string          `gorm:"type:varchar(1007);default:''" json:"name_en_us"`
	DescriptionZhCn    string          `gorm:"type:varchar(100007);default:''" json:"description_zh_cn"`
	DescriptionJaJp    string          `gorm:"type:varchar(100007);default:''" json:"description_ja_jp"`
	DescriptionEnUs    string          `gorm:"type:varchar(100007);default:''" json:"description_en_us"`
	Created            time.Time       `gorm:"autoCreateTime" json:"created"`
	Updated            time.Time       `gorm:"autoUpdateTime" json:"updated"`

	Aliases []PatchCharAlias `gorm:"foreignKey:PatchCharID" json:"alias,omitempty"`
}

func (PatchChar) TableName() string { return "patch_char" }

// PatchCharAlias represents a character alias
type PatchCharAlias struct {
	ID          int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string    `gorm:"type:varchar(233);uniqueIndex:idx_char_alias;index" json:"name"`
	PatchCharID int       `gorm:"uniqueIndex:idx_char_alias;index;not null" json:"patch_char_id"`
	Created     time.Time `gorm:"autoCreateTime" json:"created"`
	Updated     time.Time `gorm:"autoUpdateTime" json:"updated"`
}

func (PatchCharAlias) TableName() string { return "patch_char_alias" }

// PatchPerson represents a staff member
type PatchPerson struct {
	ID              int             `gorm:"primaryKey;autoIncrement" json:"id"`
	Image           string          `gorm:"type:varchar(1007);default:''" json:"image"`
	Roles           model.JSONArray `gorm:"type:jsonb;default:'[]'" json:"roles"`
	Language        string          `gorm:"default:''" json:"language"`
	Links           model.JSONArray `gorm:"type:jsonb;default:'[]'" json:"links"`
	VndbStaffID     *string         `gorm:"uniqueIndex;type:varchar(32)" json:"vndb_staff_id"`
	BangumiPersonID *int            `gorm:"uniqueIndex" json:"bangumi_person_id"`
	NameZhCn        string          `gorm:"type:varchar(1007);default:''" json:"name_zh_cn"`
	NameJaJp        string          `gorm:"type:varchar(1007);default:''" json:"name_ja_jp"`
	NameEnUs        string          `gorm:"type:varchar(1007);default:''" json:"name_en_us"`
	DescriptionZhCn string          `gorm:"type:varchar(100007);default:''" json:"description_zh_cn"`
	DescriptionJaJp string          `gorm:"type:varchar(100007);default:''" json:"description_ja_jp"`
	DescriptionEnUs string          `gorm:"type:varchar(100007);default:''" json:"description_en_us"`
	Birthday        string          `gorm:"default:''" json:"birthday"`
	BloodType       string          `gorm:"default:''" json:"blood_type"`
	Birthplace      string          `gorm:"default:''" json:"birthplace"`
	Office          string          `gorm:"default:''" json:"office"`
	X               string          `gorm:"default:''" json:"x"`
	Spouse          string          `gorm:"default:''" json:"spouse"`
	OfficialWebsite string          `gorm:"default:''" json:"official_website"`
	Blog            string          `gorm:"default:''" json:"blog"`
	Created         time.Time       `gorm:"autoCreateTime" json:"created"`
	Updated         time.Time       `gorm:"autoUpdateTime" json:"updated"`

	Aliases []PatchPersonAlias `gorm:"foreignKey:PersonID" json:"alias,omitempty"`
}

func (PatchPerson) TableName() string { return "patch_person" }

// PatchPersonAlias represents a person alias
type PatchPersonAlias struct {
	ID       int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Name     string    `gorm:"type:varchar(233);uniqueIndex:idx_person_alias;index" json:"name"`
	PersonID int       `gorm:"uniqueIndex:idx_person_alias;index;not null" json:"person_id"`
	Created  time.Time `gorm:"autoCreateTime" json:"created"`
	Updated  time.Time `gorm:"autoUpdateTime" json:"updated"`
}

func (PatchPersonAlias) TableName() string { return "patch_person_alias" }

// PatchRelease represents a VNDB release
type PatchRelease struct {
	ID        int             `gorm:"primaryKey;autoIncrement" json:"id"`
	PatchID   int             `gorm:"index;not null" json:"patch_id"`
	RID       string          `gorm:"uniqueIndex;type:varchar(16)" json:"rid"`
	Title     string          `gorm:"type:varchar(1007)" json:"title"`
	Released  string          `gorm:"type:varchar(107);default:'2019-10-07'" json:"released"`
	Platforms model.JSONArray `gorm:"type:jsonb;default:'[]'" json:"platforms"`
	Languages model.JSONArray `gorm:"type:jsonb;default:'[]'" json:"languages"`
	Minage    int             `gorm:"default:0" json:"minage"`
	Created   time.Time       `gorm:"autoCreateTime" json:"created"`
	Updated   time.Time       `gorm:"autoUpdateTime" json:"updated"`
}

func (PatchRelease) TableName() string { return "patch_release" }
