// Package cron centralizes all cron jobs.
package cron

import (
	"context"
	"log/slog"
	"time"

	galgameClient "kun-galgame-patch-api/internal/galgame/client"
	"kun-galgame-patch-api/pkg/catalogclient"
	"kun-galgame-patch-api/pkg/imageclient"
	"kun-galgame-patch-api/pkg/moemoepoint"

	"github.com/robfig/cron/v3"
	"gorm.io/gorm"
)

// Start starts all cron jobs and returns a stop function for graceful shutdown.
//
// Job list:
//  1. Daily 00:00: reset daily_image_count / daily_check_in / daily_upload_size on the user table
//  2. Every 10 minutes: pull the catalog claim-event feed, apply the four review
//     verdicts (idempotent via claim_event_processed; awards +3 moemoepoint on
//     an approval)
//  3. Daily 04:00: ref-ping image_service for every hash moyu still references
//     (doc banners + content /image/<hash> tokens) so its GC doesn't reclaim them
func Start(
	db *gorm.DB,
	galgame *galgameClient.Client,
	catalog *catalogclient.Client,
	mp *moemoepoint.Client,
	img *imageclient.Client,
) func() {
	// Pin the schedule to Asia/Shanghai so the daily 00:00 reset fires at the
	// intended civil midnight regardless of host TZ (audit F085). The check-in
	// idempotency key's date (user/service) is pinned to the same zone so the
	// "day" boundary agrees on both sides. Fall back to host-local if tzdata
	// is unavailable.
	loc, locErr := time.LoadLocation("Asia/Shanghai")
	if locErr != nil || loc == nil {
		loc = time.Local
	}
	c := cron.New(cron.WithLocation(loc))

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

	// ── Every 10 minutes: sync the catalog claim-event feed ─────
	// Only registered when the catalog S2S client is configured; tests / cmd
	// helpers that build the app without one won't run this. On the FIRST run
	// after deploy the expected log line is "已初始化游标 (不回填历史)" — the
	// cursor seeds at the feed head rather than replaying the re-site backfill.
	if catalog != nil && catalog.Configured() {
		if _, err := c.AddFunc(claimSyncSchedule, func() {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
			defer cancel()
			applied, cursor, err := RunClaimEventSync(ctx, db, catalog, galgame, mp)
			if err != nil {
				slog.Error("catalog claim 同步失败", "error", err, "applied", applied, "cursor", cursor)
				return
			}
			if applied > 0 {
				slog.Info("catalog claim 同步完成", "applied", applied, "cursor", cursor)
			}
		}); err != nil {
			slog.Error("注册 catalog claim 同步任务失败", "error", err)
		}
	}

	// ── Daily 04:00: ref-ping image_service ──────────────
	// Refreshes last_referenced_at for every hash moyu still references so the
	// image_service GC (cold-storage TTL ~60d) doesn't reclaim them. Only when
	// image_service is configured (skipped in dev with no client).
	if img != nil && img.Configured() {
		if _, err := c.AddFunc("0 4 * * *", func() {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
			defer cancel()
			updated, notFound, err := RunReferencePing(ctx, db, img)
			if err != nil {
				slog.Error("image ref-ping 失败", "error", err)
				return
			}
			slog.Info("image ref-ping 完成", "updated", updated, "not_found", notFound)
		}); err != nil {
			slog.Error("注册 image ref-ping 任务失败", "error", err)
		}
	}

	c.Start()
	slog.Info("定时任务已启动")

	return func() {
		ctx := c.Stop()
		<-ctx.Done()
		slog.Info("定时任务已停止")
	}
}
