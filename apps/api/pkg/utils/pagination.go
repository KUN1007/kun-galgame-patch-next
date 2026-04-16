package utils

import "gorm.io/gorm"

type Pagination struct {
	Page  int `query:"page" validate:"required,min=1"`
	Limit int `query:"limit" validate:"required,min=1,max=100"`
}

func (p *Pagination) Offset() int {
	return (p.Page - 1) * p.Limit
}

func Paginate(page, limit int) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		offset := (page - 1) * limit
		return db.Offset(offset).Limit(limit)
	}
}
