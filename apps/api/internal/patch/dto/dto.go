package dto

// PatchCreateRequest 创建补丁请求体（D12，2026-04-21）。
//
// 游戏元数据（name / introduction / banner / released / content_limit / alias）
// 全部从 Galgame Wiki 获取，客户端只需要提供 vndb_id。服务端会调 Wiki
// /galgame/check 验证并拿到 galgame_id 回填到本地。
type PatchCreateRequest struct {
	VndbID string `json:"vndb_id" validate:"required,max=10"`
}

// PatchUpdateRequest D12 之后补丁本身几乎没有可编辑字段。保留此 DTO 仅用于
// 重新绑定 vndb_id 的极端情况（比如误链）。
type PatchUpdateRequest struct {
	VndbID string `json:"vndb_id" validate:"required,max=10"`
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

// PatchResourceCreateRequest is the request body for creating a resource.
//
// D10 变更（2026-04-21）：不再有 Hash（BLAKE3）字段。
// S3 资源上传后前端拿到 s3_key（完整对象键），在这里回传；服务端会 HeadObject 校验。
// 外部链接资源（storage != "s3"）则 s3_key 留空，content 直接填外链。
type PatchResourceCreateRequest struct {
	PatchID   int      `json:"patch_id" validate:"required,min=1"`
	Storage   string   `json:"storage" validate:"required"`
	Name      string   `json:"name" validate:"max=300"`
	ModelName string   `json:"model_name" validate:"max=1007"`
	S3Key     string   `json:"s3_key" validate:"max=2048"`
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
