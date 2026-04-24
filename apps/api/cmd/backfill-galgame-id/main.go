// cmd/backfill-galgame-id queries Galgame Wiki for each local patch row with
// galgame_id=0 (keyed by vndb_id) and backfills galgame_id (D12 cleanup tool).
//
// Usage:
//
//	go run ./cmd/backfill-galgame-id                  # process all rows with galgame_id=0
//	go run ./cmd/backfill-galgame-id -dry-run         # print plan only, do not write DB
//	go run ./cmd/backfill-galgame-id -concurrency=8   # concurrency (default 4)
//	go run ./cmd/backfill-galgame-id -limit=100       # only process first N rows (for debugging)
package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"sync"
	"sync/atomic"
	"time"

	galgameClient "kun-galgame-patch-api/internal/galgame/client"
	"kun-galgame-patch-api/internal/infrastructure/database"
	patchModel "kun-galgame-patch-api/internal/patch/model"
	"kun-galgame-patch-api/pkg/config"
	"kun-galgame-patch-api/pkg/logger"

	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	dryRun := flag.Bool("dry-run", false, "只打印计划，不写库")
	concurrency := flag.Int("concurrency", 4, "并发度（同时 in-flight 的 Wiki 请求数）")
	limit := flag.Int("limit", 0, "只处理前 N 条（0=全部）")
	flag.Parse()

	cfg := config.Load()
	logger.Init(cfg.Server.Mode)

	db := database.NewPostgres(cfg.Database, cfg.Server.Mode)
	wiki := galgameClient.New(cfg.GalgameWiki.BaseURL)

	ctx := context.Background()

	// Preview total count
	var total int64
	db.Model(&patchModel.Patch{}).Where("galgame_id = 0").Count(&total)
	slog.Info("待回填数量", "missing", total, "dry_run", *dryRun, "concurrency", *concurrency, "limit", *limit)

	// Read all patches that need backfill (vndb_id + id)
	var patches []patchModel.Patch
	q := db.Model(&patchModel.Patch{}).Select("id", "vndb_id").Where("galgame_id = 0").Order("id ASC")
	if *limit > 0 {
		q = q.Limit(*limit)
	}
	if err := q.Find(&patches).Error; err != nil {
		slog.Error("读取 patch 列表失败", "error", err)
		os.Exit(1)
	}
	if len(patches) == 0 {
		fmt.Println("没有需要回填的 patch。")
		return
	}

	// Concurrency channel
	jobs := make(chan patchModel.Patch)
	var (
		wg      sync.WaitGroup
		ok      int64
		missing int64
		errors  int64
	)

	start := time.Now()

	for i := 0; i < *concurrency; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for p := range jobs {
				exists, gid, err := wiki.CheckGalgameByVndbID(ctx, p.VndbID)
				if err != nil {
					atomic.AddInt64(&errors, 1)
					slog.Warn("调 Wiki 失败", "patch_id", p.ID, "vndb_id", p.VndbID, "error", err)
					continue
				}
				if !exists {
					atomic.AddInt64(&missing, 1)
					slog.Warn("Wiki 无此 galgame（需先在 Wiki 创建）", "patch_id", p.ID, "vndb_id", p.VndbID)
					continue
				}
				if *dryRun {
					atomic.AddInt64(&ok, 1)
					slog.Info("[dry-run] 将回填", "patch_id", p.ID, "vndb_id", p.VndbID, "galgame_id", gid)
					continue
				}
				if err := db.Model(&patchModel.Patch{}).Where("id = ?", p.ID).
					UpdateColumn("galgame_id", gid).Error; err != nil {
					atomic.AddInt64(&errors, 1)
					slog.Warn("写库失败", "patch_id", p.ID, "error", err)
					continue
				}
				atomic.AddInt64(&ok, 1)
			}
		}()
	}

	// Producer: log progress every 100 rows
	go func() {
		for i, p := range patches {
			jobs <- p
			if (i+1)%100 == 0 {
				slog.Info("进度", "done", i+1, "total", len(patches),
					"ok", atomic.LoadInt64(&ok),
					"missing", atomic.LoadInt64(&missing),
					"errors", atomic.LoadInt64(&errors))
			}
		}
		close(jobs)
	}()

	wg.Wait()

	elapsed := time.Since(start)
	fmt.Println("────────────────────────────────────")
	fmt.Printf("总耗时     : %s\n", elapsed.Round(time.Millisecond))
	fmt.Printf("成功回填   : %d\n", ok)
	fmt.Printf("Wiki 无数据 : %d（这些补丁的 vndb_id 在 Wiki 里不存在，需要先去 Wiki 建）\n", missing)
	fmt.Printf("错误       : %d\n", errors)
	fmt.Println("────────────────────────────────────")

	if *dryRun {
		fmt.Println("⚠️ dry-run 模式，DB 未修改。去掉 -dry-run 真跑一次。")
	}
}
