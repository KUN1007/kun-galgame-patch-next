package dto

type GetMessageRequest struct {
	Type  string `query:"type"`
	Page  int    `query:"page" validate:"required,min=1"`
	Limit int    `query:"limit" validate:"required,min=1,max=50"`
}

type ReadMessageRequest struct {
	Type string `json:"type" validate:"required,max=20"`
}
