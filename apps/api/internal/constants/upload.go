// Package constants 集中放业务常量。上传相关的阈值原样从 apps/next-web/config/upload.ts 搬过来。
package constants

import "time"

// 单文件阈值。
const (
	// MaxSmallFileSize：走单次 PutObject 的阈值（≤ 200 MB）
	MaxSmallFileSize int64 = 200 * 1024 * 1024

	// MaxLargeFileSize：整个上传流程允许的单文件上限（1 GB）
	MaxLargeFileSize int64 = 1 * 1024 * 1024 * 1024

	// MultipartPartSize：大文件分片大小（10 MiB，S3 推荐值）
	MultipartPartSize int64 = 10 * 1024 * 1024
)

// 每日限额。
const (
	UserDailyUploadLimit    int64 = 100 * 1024 * 1024       // 100 MB
	CreatorDailyUploadLimit int64 = 5 * 1024 * 1024 * 1024  // 5 GB
)

// Presigned URL 有效期。
const (
	PresignPutObjectTTL  = 2 * time.Hour
	PresignUploadPartTTL = 4 * time.Hour
)

// AllowedResourceExtensions 对齐 apps/next-web/constants/resource.ts
var AllowedResourceExtensions = []string{".zip", ".rar", ".7z"}

// S3KeyRandomLength 是 s3_key 路径里随机段的字符数（对齐老 BLAKE3 hex 长度）。
const S3KeyRandomLength = 64

// MultipartUploadOrphanTTL 超过此时长仍未完成的 multipart 会被 cron 清理。
const MultipartUploadOrphanTTL = 24 * time.Hour

// AbortedMultipartCleanupInterval cron 跑清理的频率。
const AbortedMultipartCleanupInterval = 6 * time.Hour
