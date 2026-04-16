package dto

// PatchUpdateRequest is the request body for updating a patch
type PatchUpdateRequest struct {
	VndbID           string   `json:"vndb_id" validate:"max=10"`
	NameZhCn         string   `json:"name_zh_cn" validate:"max=1007"`
	NameJaJp         string   `json:"name_ja_jp" validate:"max=1007"`
	NameEnUs         string   `json:"name_en_us" validate:"max=1007"`
	IntroductionZhCn string   `json:"introduction_zh_cn" validate:"max=100007"`
	IntroductionJaJp string   `json:"introduction_ja_jp" validate:"max=100007"`
	IntroductionEnUs string   `json:"introduction_en_us" validate:"max=100007"`
	Alias            []string `json:"alias" validate:"max=30,dive,max=1007"`
	Released         string   `json:"released" validate:"max=30"`
	ContentLimit     string   `json:"content_limit" validate:"oneof=sfw nsfw"`
}

// GetPatchCommentRequest is the request for fetching a comment list
type GetPatchCommentRequest struct {
	Page  int `query:"page" validate:"required,min=1"`
	Limit int `query:"limit" validate:"required,min=1,max=30"`
}

// PatchCommentCreateRequest is the request body for creating a comment
type PatchCommentCreateRequest struct {
	PatchID  int    `json:"patch_id" validate:"required,min=1"`
	ParentID *int   `json:"parent_id" validate:"omitempty,min=1"`
	Content  string `json:"content" validate:"required,min=1,max=10007"`
	Captcha  string `json:"captcha" validate:"max=10"`
}

// PatchCommentUpdateRequest is the request body for updating a comment
type PatchCommentUpdateRequest struct {
	Content string `json:"content" validate:"required,min=1,max=10007"`
}

// PatchResourceCreateRequest is the request body for creating a resource
type PatchResourceCreateRequest struct {
	PatchID   int      `json:"patch_id" validate:"required,min=1"`
	Storage   string   `json:"storage" validate:"required"`
	Name      string   `json:"name" validate:"max=300"`
	ModelName string   `json:"model_name" validate:"max=1007"`
	Hash      string   `json:"hash" validate:"max=107"`
	Content   string   `json:"content" validate:"required,min=1,max=1007"`
	Size      string   `json:"size" validate:"required"`
	Code      string   `json:"code" validate:"max=1007"`
	Password  string   `json:"password" validate:"max=1007"`
	Note      string   `json:"note" validate:"max=10007"`
	Type      []string `json:"type" validate:"required,min=1,max=10"`
	Language  []string `json:"language" validate:"required,min=1,max=10"`
	Platform  []string `json:"platform" validate:"required,min=1,max=10"`
}

// PatchResourceUpdateRequest is the request body for updating a resource
type PatchResourceUpdateRequest struct {
	PatchResourceCreateRequest
}

// DuplicateCheckRequest is the request for checking VNDB ID duplicates
type DuplicateCheckRequest struct {
	VndbID string `query:"vndbId" validate:"required,max=10"`
}
