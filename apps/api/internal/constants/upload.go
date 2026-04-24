// Package constants centralizes business constants. Upload-related thresholds are copied verbatim from apps/next-web/config/upload.ts.
package constants

import "time"

// Per-file size thresholds.
const (
	// MaxSmallFileSize: threshold that uses single-shot PutObject (<= 200 MB)
	MaxSmallFileSize int64 = 200 * 1024 * 1024

	// MaxLargeFileSize: upper bound for a single file across the whole upload flow (1 GB)
	MaxLargeFileSize int64 = 1 * 1024 * 1024 * 1024

	// MultipartPartSize: chunk size for large-file multipart upload (10 MiB, S3 recommended)
	MultipartPartSize int64 = 10 * 1024 * 1024
)

// Daily quotas.
const (
	UserDailyUploadLimit    int64 = 100 * 1024 * 1024       // 100 MB
	CreatorDailyUploadLimit int64 = 5 * 1024 * 1024 * 1024  // 5 GB
)

// Presigned URL lifetimes.
const (
	PresignPutObjectTTL  = 2 * time.Hour
	PresignUploadPartTTL = 4 * time.Hour
)

// AllowedResourceExtensions aligns with apps/next-web/constants/resource.ts
var AllowedResourceExtensions = []string{".zip", ".rar", ".7z"}

// S3KeyRandomLength is the length of the random segment in s3_key paths (aligned with the legacy BLAKE3 hex length).
const S3KeyRandomLength = 64

// MultipartUploadOrphanTTL: multipart uploads unfinished past this duration are cleaned up by cron.
const MultipartUploadOrphanTTL = 24 * time.Hour

// AbortedMultipartCleanupInterval is how often the cleanup cron runs.
const AbortedMultipartCleanupInterval = 6 * time.Hour
