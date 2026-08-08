package dto

type DocCreateRequest struct {
	Category        string `json:"category" validate:"required,min=1,max=64"`
	Name            string `json:"name" validate:"required,min=1,max=128"`
	Title           string `json:"title" validate:"required,min=1,max=255"`
	Description     string `json:"description" validate:"max=2000"`
	Content         string `json:"content" validate:"required,min=1"`
	BannerImageHash string `json:"banner_image_hash" validate:"omitempty,len=64,hexadecimal"`
	Date            string `json:"date" validate:"omitempty,datetime=2006-01-02"`
	Status          *int   `json:"status" validate:"omitempty,oneof=0 1"`
	Pin             *bool  `json:"pin"`
}

type DocUpdateRequest struct {
	Category        *string `json:"category" validate:"omitempty,min=1,max=64"`
	Name            *string `json:"name" validate:"omitempty,min=1,max=128"`
	Title           *string `json:"title" validate:"omitempty,min=1,max=255"`
	Description     *string `json:"description" validate:"omitempty,max=2000"`
	Content         *string `json:"content" validate:"omitempty,min=1"`
	BannerImageHash *string `json:"banner_image_hash"`
	Date            *string `json:"date" validate:"omitempty,datetime=2006-01-02"`
	Status          *int    `json:"status" validate:"omitempty,oneof=0 1"`
	Pin             *bool   `json:"pin"`
}
