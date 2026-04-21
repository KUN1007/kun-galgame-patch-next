// Package upload 封装补丁资源的上传流程（D10，2026-04-21）。
//
// 两条独立路径：
//   - 小文件（≤ 200 MB）：PresignPutObject 一次搞定
//   - 大文件（> 200 MB, ≤ 1 GB）：multipart init / part presign / complete / abort
//
// 上传成功后，前端拿到 s3_key，调用 POST /api/patch/:id/resource 入库。
// 每日限额（daily_upload_size）在 complete 阶段按 HeadObject 返回的实际 size 扣减。
package upload

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"path/filepath"
	"regexp"
	"slices"
	"strings"

	"kun-galgame-patch-api/internal/constants"
	"kun-galgame-patch-api/internal/infrastructure/storage"
	authModel "kun-galgame-patch-api/internal/auth/model"

	"github.com/minio/minio-go/v7"
	"gorm.io/gorm"
)

// Service 组合 S3 客户端和 DB（用于限额校验/扣减）。
type Service struct {
	s3 *storage.S3Client
	db *gorm.DB
}

// New 构造 Service。
func New(s3 *storage.S3Client, db *gorm.DB) *Service {
	return &Service{s3: s3, db: db}
}

// ─── s3_key 生成 ─────────────────────────────────────

var (
	s3KeyAlphabet   = []byte("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789")
	fileNameInvalid = regexp.MustCompile(`[^\p{L}\p{N}_\-]`) // 与 apps/next-web/utils/sanitizeFileName.ts 一致
)

// sanitizeFileName 对齐原 TS 版 sanitizeFileName：保留字母数字下划线连字符，去掉所有其他字符，
// 保留扩展名，basename 裁到 100 字符以内。
func sanitizeFileName(name string) string {
	ext := filepath.Ext(name)
	base := strings.TrimSuffix(name, ext)
	base = fileNameInvalid.ReplaceAllString(base, "")
	if len([]rune(base)) > 100 {
		base = string([]rune(base)[:100])
	}
	return base + ext
}

// randomSegment 返回一个 length 字符的 [A-Za-z0-9] 随机串，替代老的 BLAKE3 hash 段。
func randomSegment(length int) (string, error) {
	b := make([]byte, length)
	max := big.NewInt(int64(len(s3KeyAlphabet)))
	for i := range b {
		n, err := rand.Int(rand.Reader, max)
		if err != nil {
			return "", err
		}
		b[i] = s3KeyAlphabet[n.Int64()]
	}
	return string(b), nil
}

// buildPatchResourceKey 构造 "patch/{patchId}/{random64}/{fileName}" 完整 S3 对象键。
func buildPatchResourceKey(patchID int, fileName string) (string, error) {
	seg, err := randomSegment(constants.S3KeyRandomLength)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("patch/%d/%s/%s", patchID, seg, sanitizeFileName(fileName)), nil
}

// ─── 校验（auth 之外的业务规则） ─────────────────────────

// validatePreUpload 在 init 阶段做预检：扩展名、上限、每日限额（基于声明 size）。
func (s *Service) validatePreUpload(uid int, fileName string, declaredSize int64) error {
	if declaredSize <= 0 || declaredSize > constants.MaxLargeFileSize {
		return fmt.Errorf("文件大小超过 1GB 上限")
	}

	ext := strings.ToLower(filepath.Ext(fileName))
	if !slices.Contains(constants.AllowedResourceExtensions, ext) {
		return fmt.Errorf("不支持的文件类型: %s", ext)
	}

	var user authModel.User
	if err := s.db.Select("role", "daily_upload_size").First(&user, uid).Error; err != nil {
		return fmt.Errorf("获取用户信息失败")
	}

	limit := s.dailyLimit(user.Role)
	if int64(user.DailyUploadSize)+declaredSize > limit {
		return fmt.Errorf("超过今日上传限额 (%d MB)", limit/1024/1024)
	}
	return nil
}

func (s *Service) dailyLimit(role int) int64 {
	if role >= 2 {
		return constants.CreatorDailyUploadLimit
	}
	return constants.UserDailyUploadLimit
}

// verifyAndFinalize 在 complete 阶段被 small/multipart 共用：
//  1. HeadObject 确认对象确实存在
//  2. 实际 size 与声明 size 比对（不一致 → 删除 + 报错）
//  3. 累加 daily_upload_size（原子 UPDATE）
func (s *Service) verifyAndFinalize(ctx context.Context, uid int, s3Key string, declared int64) (int64, error) {
	info, err := s.s3.StatObject(ctx, s3Key)
	if err != nil {
		return 0, fmt.Errorf("HeadObject 失败: %w", err)
	}
	actual := info.Size

	if actual != declared {
		_ = s.s3.DeleteObject(ctx, s3Key)
		return 0, fmt.Errorf("文件大小不一致（声明 %d，实际 %d），已删除", declared, actual)
	}
	if actual > constants.MaxLargeFileSize {
		_ = s.s3.DeleteObject(ctx, s3Key)
		return 0, fmt.Errorf("文件大小超过 1GB 上限，已删除")
	}

	var user authModel.User
	if err := s.db.Select("role", "daily_upload_size").First(&user, uid).Error; err != nil {
		return 0, fmt.Errorf("获取用户信息失败")
	}
	if int64(user.DailyUploadSize)+actual > s.dailyLimit(user.Role) {
		_ = s.s3.DeleteObject(ctx, s3Key)
		return 0, fmt.Errorf("超过今日上传限额，已删除")
	}

	if err := s.db.Model(&authModel.User{}).
		Where("id = ?", uid).
		UpdateColumn("daily_upload_size", gorm.Expr("daily_upload_size + ?", actual)).Error; err != nil {
		return 0, fmt.Errorf("扣减限额失败: %w", err)
	}
	return actual, nil
}

// ─── 对外动作 ────────────────────────────────────────

// InitSmall 小文件 init：生成 s3_key 和 presigned PUT URL。
func (s *Service) InitSmall(ctx context.Context, uid int, req SmallInitRequest) (*SmallInitResponse, error) {
	if req.FileSize > constants.MaxSmallFileSize {
		return nil, fmt.Errorf("小文件上限 200MB，请走 multipart")
	}
	if err := s.validatePreUpload(uid, req.FileName, req.FileSize); err != nil {
		return nil, err
	}

	key, err := buildPatchResourceKey(req.PatchID, req.FileName)
	if err != nil {
		return nil, err
	}
	u, err := s.s3.PresignPutObject(ctx, key, constants.PresignPutObjectTTL)
	if err != nil {
		return nil, err
	}
	return &SmallInitResponse{S3Key: key, UploadURL: u}, nil
}

// CompleteSmall 小文件 complete：HeadObject + 扣限额。
func (s *Service) CompleteSmall(ctx context.Context, uid int, req SmallCompleteRequest) (*CompleteResponse, error) {
	size, err := s.verifyAndFinalize(ctx, uid, req.S3Key, req.DeclaredSize)
	if err != nil {
		return nil, err
	}
	return &CompleteResponse{S3Key: req.S3Key, Size: size}, nil
}

// InitMultipart 大文件 init：CreateMultipartUpload + 为每个 part 签 URL。
func (s *Service) InitMultipart(ctx context.Context, uid int, req MultipartInitRequest) (*MultipartInitResponse, error) {
	if req.FileSize <= constants.MaxSmallFileSize {
		return nil, fmt.Errorf("≤ 200MB 请走 /upload/small")
	}
	if err := s.validatePreUpload(uid, req.FileName, req.FileSize); err != nil {
		return nil, err
	}

	key, err := buildPatchResourceKey(req.PatchID, req.FileName)
	if err != nil {
		return nil, err
	}

	uploadID, err := s.s3.InitMultipart(ctx, key)
	if err != nil {
		return nil, err
	}

	urls := make([]string, 0, req.PartCount)
	for i := 1; i <= req.PartCount; i++ {
		u, err := s.s3.PresignUploadPart(ctx, key, uploadID, i, constants.PresignUploadPartTTL)
		if err != nil {
			// 签一半失败 → 直接 abort 上传，让客户端重来
			_ = s.s3.AbortMultipart(ctx, key, uploadID)
			return nil, fmt.Errorf("签 part %d 失败: %w", i, err)
		}
		urls = append(urls, u)
	}

	return &MultipartInitResponse{S3Key: key, UploadID: uploadID, PartURLs: urls}, nil
}

// CompleteMultipart 大文件 complete：CompleteMultipartUpload + HeadObject + 扣限额。
func (s *Service) CompleteMultipart(ctx context.Context, uid int, req MultipartCompleteRequest) (*CompleteResponse, error) {
	parts := make([]storage.CompletedPart, 0, len(req.Parts))
	for _, p := range req.Parts {
		parts = append(parts, storage.CompletedPart{PartNumber: p.PartNumber, ETag: p.ETag})
	}

	if err := s.s3.CompleteMultipart(ctx, req.S3Key, req.UploadID, parts); err != nil {
		return nil, err
	}

	size, err := s.verifyAndFinalize(ctx, uid, req.S3Key, req.DeclaredSize)
	if err != nil {
		return nil, err
	}
	return &CompleteResponse{S3Key: req.S3Key, Size: size}, nil
}

// AbortMultipart 客户端主动取消 multipart。
func (s *Service) AbortMultipart(ctx context.Context, req MultipartAbortRequest) error {
	return s.s3.AbortMultipart(ctx, req.S3Key, req.UploadID)
}

// ─── minio 错误代码辅助 ──────────────────────────────

// IsMinioNotFound 在其他层判断"对象不存在"时用。
func IsMinioNotFound(err error) bool {
	if err == nil {
		return false
	}
	return minio.ToErrorResponse(err).Code == "NoSuchKey"
}
