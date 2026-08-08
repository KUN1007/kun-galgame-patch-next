package upload

type InitRequest struct {
	GalgameID int    `json:"galgame_id" validate:"required,min=1"`
	FileName  string `json:"file_name" validate:"required,min=1,max=300"`
	FileSize  int64  `json:"file_size" validate:"required,min=1"`
	MimeType  string `json:"mime_type" validate:"max=100"`
}

type PartURL struct {
	PartNumber int    `json:"part_number"`
	URL        string `json:"url"`
}

type InitResponse struct {
	ArtifactUUID string    `json:"artifact_uuid"`
	Multipart    bool      `json:"multipart"`
	UploadURL    string    `json:"upload_url,omitempty"`
	PartSize     int64     `json:"part_size,omitempty"`
	Parts        []PartURL `json:"parts,omitempty"`
	ExpiresAt    string    `json:"expires_at"`
}

type CompletedPart struct {
	PartNumber int    `json:"part_number" validate:"required,min=1"`
	ETag       string `json:"etag" validate:"required,min=1"`
}

type CompleteRequest struct {
	ArtifactUUID string          `json:"artifact_uuid" validate:"required,min=1,max=64"`
	DeclaredSize int64           `json:"declared_size" validate:"required,min=1"`
	Parts        []CompletedPart `json:"parts" validate:"omitempty,max=10000,dive"`
}

type CompleteResponse struct {
	ArtifactUUID string `json:"artifact_uuid"`
	Size         int64  `json:"size"`
}

type AbortRequest struct {
	ArtifactUUID string `json:"artifact_uuid" validate:"required,min=1,max=64"`
}

type ResumeRequest struct {
	ArtifactUUID string `json:"artifact_uuid" validate:"required,min=1,max=64"`
}

type ResumePart struct {
	PartNumber int    `json:"part_number"`
	ETag       string `json:"etag"`
	Size       int64  `json:"size"`
}

type ResumeResponse struct {
	ArtifactUUID  string       `json:"artifact_uuid"`
	Multipart     bool         `json:"multipart"`
	UploadURL     string       `json:"upload_url,omitempty"`
	PartSize      int64        `json:"part_size,omitempty"`
	Parts         []PartURL    `json:"parts,omitempty"`
	UploadedParts []ResumePart `json:"uploaded_parts,omitempty"`
	ExpiresAt     string       `json:"expires_at"`
}
