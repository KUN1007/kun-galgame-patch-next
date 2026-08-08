package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"sync"
	"sync/atomic"
	"time"

	"kun-galgame-patch-api/internal/infrastructure/database"
	"kun-galgame-patch-api/pkg/config"
	"kun-galgame-patch-api/pkg/logger"
	"kun-galgame-patch-api/pkg/moemoepoint"

	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	dryRun := flag.Bool("dry-run", false, "只打印将写入的值，不更新本地缓存")
	concurrency := flag.Int("concurrency", 8, "并发拉取 OAuth 余额的数量")
	flag.Parse()

	cfg := config.Load()
	logger.Init(cfg.Server.Mode)

	db := database.NewPostgres(cfg.Database, cfg.Server.Mode)
	mp := moemoepoint.New(moemoepoint.Config{
		BaseURL:      cfg.OAuth.ServerURL,
		ClientID:     cfg.OAuth.ClientID,
		ClientSecret: cfg.OAuth.ClientSecret,
	})

	var ids []int
	if err := db.Table("user").Order("id").Pluck("id", &ids).Error; err != nil {
		slog.Error("拉取本地用户 id 失败", "error", err)
		return
	}
	fmt.Printf("本地用户数：%d（并发 %d，dry-run=%v）\n", len(ids), *concurrency, *dryRun)

	var synced, failed, unchanged int64
	sem := make(chan struct{}, *concurrency)
	var wg sync.WaitGroup

	for _, id := range ids {
		wg.Add(1)
		sem <- struct{}{}
		go func(uid int) {
			defer wg.Done()
			defer func() { <-sem }()

			ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()

			bal, err := mp.Balance(ctx, uid)
			if err != nil {
				atomic.AddInt64(&failed, 1)
				slog.Warn("读取 OAuth 余额失败（跳过）", "user_id", uid, "error", err)
				return
			}
			if *dryRun {
				atomic.AddInt64(&synced, 1)
				return
			}
			res := db.Exec(`UPDATE "user" SET moemoepoint = ? WHERE id = ?`, bal, uid)
			if res.Error != nil {
				atomic.AddInt64(&failed, 1)
				slog.Warn("写入本地缓存失败", "user_id", uid, "balance", bal, "error", res.Error)
				return
			}
			if res.RowsAffected == 0 {
				atomic.AddInt64(&unchanged, 1)
				return
			}
			atomic.AddInt64(&synced, 1)
		}(id)
	}
	wg.Wait()

	fmt.Printf("✅ 完成：同步 %d，未变 %d，失败/跳过 %d\n", synced, unchanged, failed)
}
