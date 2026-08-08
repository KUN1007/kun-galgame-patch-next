package model

import "time"

type SiteSetting struct {
	Key       string    `gorm:"primaryKey;type:varchar(100)" json:"key"`
	Value     string    `gorm:"type:text;not null;default:''" json:"value"`
	UpdatedBy *int      `json:"updated_by"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (SiteSetting) TableName() string { return "site_setting" }
