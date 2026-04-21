// Package storage 用 minio-go v7 封装 S3 / S3-兼容（Backblaze B2 / MinIO / R2 等）操作。
//
// 设计要点（D10，2026-04-21）：
//   - 前端直传模式：服务端只签 presigned URL，不经手文件字节
//   - 小文件：PresignedPutObject
//   - 大文件：NewMultipartUpload → 每个 part 签 PresignedUploadPart URL → CompleteMultipartUpload
//   - 上传后用 StatObject 验 size（= HeadObject）
//   - 孤儿清理：ListIncompleteUploads + RemoveIncompleteUpload（cron 周期跑）
package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/url"
	"strings"
	"time"

	"kun-galgame-patch-api/pkg/config"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// S3Client 包装 minio.Client，提供 presigned URL / multipart / head / delete 操作。
type S3Client struct {
	client    *minio.Client
	core      *minio.Core
	bucket    string
	publicURL string // 公开下载前缀：如 "https://s3.us-east-005.backblazeb2.com/kun-galgame-patch"
}

// NewS3 按 config 初始化客户端。cfg.Endpoint 为空时返回禁用的占位实例（dev 无 S3 也能启动）。
func NewS3(cfg config.S3Config) *S3Client {
	if cfg.Endpoint == "" {
		slog.Warn("S3 未配置，storage 模块处于禁用状态")
		return &S3Client{}
	}

	host, secure, err := parseEndpoint(cfg.Endpoint)
	if err != nil {
		panic("解析 S3 endpoint 失败: " + err.Error())
	}

	mc, err := minio.New(host, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: secure,
		Region: cfg.Region,
	})
	if err != nil {
		panic("minio client 初始化失败: " + err.Error())
	}

	slog.Info("S3 客户端就绪", "endpoint", host, "bucket", cfg.Bucket, "tls", secure)

	return &S3Client{
		client:    mc,
		core:      &minio.Core{Client: mc},
		bucket:    cfg.Bucket,
		publicURL: strings.TrimRight(cfg.Endpoint, "/") + "/" + cfg.Bucket,
	}
}

// parseEndpoint 把完整 URL（"https://s3.xxx.com"）拆成 host 和 TLS 开关，
// minio-go 要求 host 部分无 scheme。
func parseEndpoint(raw string) (host string, secure bool, err error) {
	if !strings.Contains(raw, "://") {
		return raw, true, nil
	}
	u, perr := url.Parse(raw)
	if perr != nil {
		return "", false, perr
	}
	return u.Host, u.Scheme == "https", nil
}

// Ready 报告 client 是否已配置。未配置时所有操作返回 ErrNotConfigured。
func (c *S3Client) Ready() bool { return c.client != nil }

// ErrNotConfigured 在 S3 未配置时返回。
var ErrNotConfigured = errors.New("S3 client 未配置")

func (c *S3Client) check() error {
	if !c.Ready() {
		return ErrNotConfigured
	}
	return nil
}

// Bucket 返回 bucket 名，给上层（handler）拼 key 用。
func (c *S3Client) Bucket() string { return c.bucket }

// PublicURL 返回某 s3_key 对应的公开下载 URL。
func (c *S3Client) PublicURL(s3Key string) string {
	return c.publicURL + "/" + s3Key
}

// ─────────────────────────────────────────────────────────────
// 小文件：PresignedPutObject
// ─────────────────────────────────────────────────────────────

// PresignPutObject 为给定 s3_key 生成一个有效期 ttl 的上传 URL。
// 客户端直接 PUT 到返回的 URL 即可完成上传。
func (c *S3Client) PresignPutObject(ctx context.Context, s3Key string, ttl time.Duration) (string, error) {
	if err := c.check(); err != nil {
		return "", err
	}
	u, err := c.client.PresignedPutObject(ctx, c.bucket, s3Key, ttl)
	if err != nil {
		return "", fmt.Errorf("签 PutObject URL 失败: %w", err)
	}
	return u.String(), nil
}

// ─────────────────────────────────────────────────────────────
// 大文件 multipart：init / sign-parts / complete / abort
// ─────────────────────────────────────────────────────────────

// InitMultipart 发起一个新的 multipart upload，返回 uploadID。
func (c *S3Client) InitMultipart(ctx context.Context, s3Key string) (string, error) {
	if err := c.check(); err != nil {
		return "", err
	}
	uploadID, err := c.core.NewMultipartUpload(ctx, c.bucket, s3Key, minio.PutObjectOptions{})
	if err != nil {
		return "", fmt.Errorf("发起 multipart 失败: %w", err)
	}
	return uploadID, nil
}

// PresignUploadPart 为 multipart 的某个 part 生成 presigned URL（partNumber 从 1 开始）。
func (c *S3Client) PresignUploadPart(ctx context.Context, s3Key, uploadID string, partNumber int, ttl time.Duration) (string, error) {
	if err := c.check(); err != nil {
		return "", err
	}
	q := make(url.Values)
	q.Set("uploadId", uploadID)
	q.Set("partNumber", fmt.Sprintf("%d", partNumber))

	u, err := c.client.Presign(ctx, "PUT", c.bucket, s3Key, ttl, q)
	if err != nil {
		return "", fmt.Errorf("签 UploadPart URL 失败: %w", err)
	}
	return u.String(), nil
}

// CompletedPart 是 multipart 完成请求里的一个 part。
type CompletedPart struct {
	PartNumber int    `json:"part_number"`
	ETag       string `json:"etag"`
}

// CompleteMultipart 把所有 part 合并为最终对象。parts 不需要预先排序。
func (c *S3Client) CompleteMultipart(ctx context.Context, s3Key, uploadID string, parts []CompletedPart) error {
	if err := c.check(); err != nil {
		return err
	}
	mParts := make([]minio.CompletePart, 0, len(parts))
	for _, p := range parts {
		mParts = append(mParts, minio.CompletePart{
			PartNumber: p.PartNumber,
			ETag:       p.ETag,
		})
	}
	_, err := c.core.CompleteMultipartUpload(ctx, c.bucket, s3Key, uploadID, mParts, minio.PutObjectOptions{})
	if err != nil {
		return fmt.Errorf("完成 multipart 失败: %w", err)
	}
	return nil
}

// AbortMultipart 放弃某个未完成的 multipart。
func (c *S3Client) AbortMultipart(ctx context.Context, s3Key, uploadID string) error {
	if err := c.check(); err != nil {
		return err
	}
	if err := c.core.AbortMultipartUpload(ctx, c.bucket, s3Key, uploadID); err != nil {
		return fmt.Errorf("abort multipart 失败: %w", err)
	}
	return nil
}

// ─────────────────────────────────────────────────────────────
// 对象元信息 + 删除
// ─────────────────────────────────────────────────────────────

// PutObject 服务端直接上传（用于 banner 这类需要先做图像处理的场景）。
// 小对象用，走服务端出口带宽；大文件请走 presigned URL 路径。
func (c *S3Client) PutObject(ctx context.Context, s3Key string, reader io.Reader, size int64, contentType string) error {
	if err := c.check(); err != nil {
		return err
	}
	_, err := c.client.PutObject(ctx, c.bucket, s3Key, reader, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return fmt.Errorf("PutObject 失败: %w", err)
	}
	return nil
}

// StatObject 对应 S3 HeadObject，拿到对象 size/etag/contentType 等。
func (c *S3Client) StatObject(ctx context.Context, s3Key string) (minio.ObjectInfo, error) {
	if err := c.check(); err != nil {
		return minio.ObjectInfo{}, err
	}
	return c.client.StatObject(ctx, c.bucket, s3Key, minio.StatObjectOptions{})
}

// IsNotFound 判断 StatObject/DeleteObject 返回的 error 是否为"对象不存在"。
func IsNotFound(err error) bool {
	if err == nil {
		return false
	}
	return minio.ToErrorResponse(err).Code == "NoSuchKey"
}

// DeleteObject 删除对象。不存在时也返回 nil（幂等）。
func (c *S3Client) DeleteObject(ctx context.Context, s3Key string) error {
	if err := c.check(); err != nil {
		return err
	}
	err := c.client.RemoveObject(ctx, c.bucket, s3Key, minio.RemoveObjectOptions{})
	if err != nil && !IsNotFound(err) {
		return fmt.Errorf("删除对象 %s 失败: %w", s3Key, err)
	}
	return nil
}

// ─────────────────────────────────────────────────────────────
// 孤儿 multipart 清理（cron 用）
// ─────────────────────────────────────────────────────────────

// IncompleteUpload 代表一个未完成的 multipart，用于 cron 清理。
type IncompleteUpload struct {
	Key       string
	UploadID  string
	Initiated time.Time
}

// ListIncompleteUploads 列出所有未完成的 multipart。prefix 可以限定范围，为空则列整个 bucket。
func (c *S3Client) ListIncompleteUploads(ctx context.Context, prefix string) ([]IncompleteUpload, error) {
	if err := c.check(); err != nil {
		return nil, err
	}
	var out []IncompleteUpload
	for info := range c.client.ListIncompleteUploads(ctx, c.bucket, prefix, true) {
		if info.Err != nil {
			return nil, info.Err
		}
		out = append(out, IncompleteUpload{
			Key:       info.Key,
			UploadID:  info.UploadID,
			Initiated: info.Initiated,
		})
	}
	return out, nil
}

// RemoveIncompleteUpload 中止一个进行中的 multipart（清理）。
func (c *S3Client) RemoveIncompleteUpload(ctx context.Context, s3Key string) error {
	if err := c.check(); err != nil {
		return err
	}
	return c.client.RemoveIncompleteUpload(ctx, c.bucket, s3Key)
}
