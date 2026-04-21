// Package cron 集中管理定时任务。
package cron

import (
	"context"
	"log/slog"
	"time"

	"kun-galgame-patch-api/internal/constants"
	"kun-galgame-patch-api/internal/infrastructure/storage"

	"github.com/robfig/cron/v3"
	"gorm.io/gorm"
)

// Start 启动所有定时任务，返回 stop 函数用于优雅关停。
//
// 任务清单：
//  1. 每日 00:00 重置 user 表的 daily_image_count / daily_check_in / daily_upload_size
//  2. 每 6 小时清理 S3 里超过 24h 仍未完成的 multipart upload（D10 方案 B）
func Start(db *gorm.DB, s3 *storage.S3Client) func() {
	c := cron.New()

	// ── 每日 00:00 重置限额字段 ───────────────────────
	if _, err := c.AddFunc("0 0 * * *", func() {
		result := db.Table("user").Where(
			"daily_image_count <> 0 OR daily_check_in <> 0 OR daily_upload_size <> 0",
		).Updates(map[string]any{
			"daily_image_count": 0,
			"daily_check_in":    0,
			"daily_upload_size": 0,
		})
		if result.Error != nil {
			slog.Error("每日重置失败", "error", result.Error)
			return
		}
		slog.Info("每日重置完成", "affected", result.RowsAffected)
	}); err != nil {
		slog.Error("注册每日重置任务失败", "error", err)
	}

	// ── 每 6 小时清理 S3 未完成 multipart ──────────────
	if _, err := c.AddFunc("0 */6 * * *", func() {
		cleanupAbortedMultiparts(s3)
	}); err != nil {
		slog.Error("注册 multipart 清理任务失败", "error", err)
	}

	c.Start()
	slog.Info("定时任务已启动")

	return func() {
		ctx := c.Stop()
		<-ctx.Done()
		slog.Info("定时任务已停止")
	}
}

// cleanupAbortedMultiparts 扫描 bucket 下所有 multipart，abort 掉超过 24h 仍没完成的那些。
func cleanupAbortedMultiparts(s3 *storage.S3Client) {
	if s3 == nil || !s3.Ready() {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	uploads, err := s3.ListIncompleteUploads(ctx, "")
	if err != nil {
		slog.Error("列出未完成 multipart 失败", "error", err)
		return
	}

	cutoff := time.Now().Add(-constants.MultipartUploadOrphanTTL)
	aborted := 0
	for _, u := range uploads {
		if !u.Initiated.Before(cutoff) {
			continue
		}
		if err := s3.RemoveIncompleteUpload(ctx, u.Key); err != nil {
			slog.Warn("abort multipart 失败", "key", u.Key, "error", err)
			continue
		}
		aborted++
	}
	if aborted > 0 {
		slog.Info("清理孤儿 multipart 完成", "aborted", aborted, "scanned", len(uploads))
	}
}
