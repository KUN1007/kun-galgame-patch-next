package upload

// ─── 小文件 ──────────────────────────────────────

// SmallInitRequest 初始化小文件上传。
type SmallInitRequest struct {
	PatchID  int    `json:"patch_id" validate:"required,min=1"`
	FileName string `json:"file_name" validate:"required,min=1,max=300"`
	FileSize int64  `json:"file_size" validate:"required,min=1"`
}

// SmallInitResponse 返回 presigned PUT URL 和预分配的 s3_key。
type SmallInitResponse struct {
	S3Key     string `json:"s3_key"`
	UploadURL string `json:"upload_url"`
}

// SmallCompleteRequest 小文件上传完成后的验证请求。
type SmallCompleteRequest struct {
	S3Key        string `json:"s3_key" validate:"required,min=1,max=2048"`
	DeclaredSize int64  `json:"declared_size" validate:"required,min=1"`
}

// CompleteResponse 所有 complete 通用的成功响应。
type CompleteResponse struct {
	S3Key string `json:"s3_key"`
	Size  int64  `json:"size"`
}

// ─── Multipart ──────────────────────────────────

// MultipartInitRequest 初始化大文件 multipart 上传。
type MultipartInitRequest struct {
	PatchID   int    `json:"patch_id" validate:"required,min=1"`
	FileName  string `json:"file_name" validate:"required,min=1,max=300"`
	FileSize  int64  `json:"file_size" validate:"required,min=1"`
	PartCount int    `json:"part_count" validate:"required,min=1,max=10000"`
}

// MultipartInitResponse 返回 uploadId 和所有 part 的 presigned URL。
type MultipartInitResponse struct {
	S3Key    string   `json:"s3_key"`
	UploadID string   `json:"upload_id"`
	PartURLs []string `json:"part_urls"` // 下标 0 对应 part_number 1
}

// UploadedPart 客户端上传完一个 part 后拿到的 ETag。
type UploadedPart struct {
	PartNumber int    `json:"part_number" validate:"required,min=1"`
	ETag       string `json:"etag" validate:"required,min=1"`
}

// MultipartCompleteRequest 合并 multipart 上传。
type MultipartCompleteRequest struct {
	S3Key        string         `json:"s3_key" validate:"required,min=1,max=2048"`
	UploadID     string         `json:"upload_id" validate:"required,min=1"`
	DeclaredSize int64          `json:"declared_size" validate:"required,min=1"`
	Parts        []UploadedPart `json:"parts" validate:"required,min=1,max=10000,dive"`
}

// MultipartAbortRequest 主动放弃 multipart 上传。
type MultipartAbortRequest struct {
	S3Key    string `json:"s3_key" validate:"required,min=1,max=2048"`
	UploadID string `json:"upload_id" validate:"required,min=1"`
}
