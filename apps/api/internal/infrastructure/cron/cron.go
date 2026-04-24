// Package cron centralizes all cron jobs.
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

// Start starts all cron jobs and returns a stop function for graceful shutdown.
//
// Job list:
//  1. Daily 00:00: reset daily_image_count / daily_check_in / daily_upload_size on the user table
//  2. Every 6 hours: clean up S3 multipart uploads still unfinished after 24h (D10 plan B)
func Start(db *gorm.DB, s3 *storage.S3Client) func() {
	c := cron.New()

	// ── Daily 00:00: reset quota fields ───────────────
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

	// ── Every 6 hours: clean up unfinished S3 multipart uploads ──
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

// cleanupAbortedMultiparts scans all multipart uploads in the bucket and aborts any that have been pending for more than 24h.
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
