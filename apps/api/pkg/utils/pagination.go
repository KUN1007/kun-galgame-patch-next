package utils

type Pagination struct {
	Page  int `query:"page" validate:"required,min=1"`
	Limit int `query:"limit" validate:"required,min=1,max=100"`
}

func (p *Pagination) Offset() int {
	return (p.Page - 1) * p.Limit
}
