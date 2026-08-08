package main

import (
	"context"
	"flag"
	"log/slog"
	"os"
	"sync"
	"sync/atomic"

	galgameClient "kun-galgame-patch-api/internal/galgame/client"
	"kun-galgame-patch-api/internal/infrastructure/database"
	patchModel "kun-galgame-patch-api/internal/patch/model"
	"kun-galgame-patch-api/pkg/config"
	"kun-galgame-patch-api/pkg/logger"
	"kun-galgame-patch-api/pkg/utils"

	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	dryRun := flag.Bool("dry-run", false, "只打印计划，不写库")
	onlyNull := flag.Bool("only-null", true, "只补 release_date IS NULL 的行（false = 全量刷新，覆盖已有值）")
	concurrency := flag.Int("concurrency", 8, "并发 GetGalgame 请求数")
	flag.Parse()

	cfg := config.Load()
	logger.Init(cfg.Server.Mode)

	db := database.NewPostgres(cfg.Database, cfg.Server.Mode)
	galgame := galgameClient.NewWithKey(cfg.NextMoeAPI.BaseURL, cfg.NextMoeAPI.APIKey)
	ctx := context.Background()

	var ids []int
	q := db.Model(&patchModel.Patch{})
	if *onlyNull {
		q = q.Where("release_date IS NULL")
	}
	if err := q.Order("id").Pluck("id", &ids).Error; err != nil {
		slog.Error("拉取 patch id 失败", "error", err)
		os.Exit(1)
	}
	slog.Info("backfill release_date 开始",
		"candidates", len(ids), "dry_run", *dryRun, "only_null", *onlyNull, "concurrency", *concurrency)

	var scanned, updated, noDate, failed atomic.Int64
	sem := make(chan struct{}, *concurrency)
	var wg sync.WaitGroup

	for _, id := range ids {
		wg.Add(1)
		sem <- struct{}{}
		go func(id int) {
			defer wg.Done()
			defer func() { <-sem }()

			n := scanned.Add(1)
			if n%500 == 0 {
				slog.Info("进度", "scanned", n, "updated", updated.Load(), "no_date", noDate.Load(), "failed", failed.Load())
			}

			env, err := galgame.GetGalgame(ctx, id, "")
			if err != nil || env == nil {
				failed.Add(1)
				return
			}
			if env.Galgame.ReleaseDate == nil {
				noDate.Add(1)
				return
			}
			d := utils.ParseGalgameReleaseDate(*env.Galgame.ReleaseDate)
			if d == nil {
				noDate.Add(1)
				return
			}
			if *dryRun {
				updated.Add(1)
				return
			}
			if err := db.Model(&patchModel.Patch{}).Where("id = ?", id).
				Update("release_date", d).Error; err != nil {
				slog.Warn("更新 release_date 失败", "id", id, "error", err)
				failed.Add(1)
				return
			}
			updated.Add(1)
		}(id)
	}
	wg.Wait()

	slog.Info("backfill release_date 完成",
		"scanned", scanned.Load(), "updated", updated.Load(),
		"no_date", noDate.Load(), "failed", failed.Load())
}
