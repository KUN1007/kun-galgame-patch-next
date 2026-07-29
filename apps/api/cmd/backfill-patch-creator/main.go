// Command backfill-patch-creator fills patch.creator_id — the frozen snapshot
// of each galgame's WIKI ENTRY CREATOR — from the surviving wiki face's
// ownership-meta batch.
//
// Why a snapshot at all: until wave A2-2 the creator badge read
// `galgame.user_id` off every batch response. That field is wiki PRODUCT state,
// and the canonical catalog face moyu re-anchored on does not carry another
// service's user model by design (refs/proj/106 R2). Ruling R12 puts
// display-class wiki authorship on a one-time local snapshot: wiki-era
// contributions are frozen at the archive, so there is nothing to keep live.
//
// Run ONCE after migration 027. It is idempotent and resumable — rows that
// already have a creator_id are skipped unless -force is given — so an
// interrupted run is simply re-run.
//
//	go run ./cmd/backfill-patch-creator            # dry run, prints the plan
//	go run ./cmd/backfill-patch-creator -apply
//
// After the wiki face retires this tool has no data source and should be
// deleted along with it; new rows get their snapshot at creation time
// (ensureLocalPatch / createPatchRow).
package main

import (
	"context"
	"flag"
	"log/slog"
	"os"
	"time"

	galgameClient "kun-galgame-patch-api/internal/galgame/client"
	"kun-galgame-patch-api/internal/infrastructure/database"
	patchModel "kun-galgame-patch-api/internal/patch/model"
	"kun-galgame-patch-api/pkg/config"
)

func main() {
	apply := flag.Bool("apply", false, "write the resolved creator ids (default: dry run)")
	force := flag.Bool("force", false, "also overwrite rows that already carry a creator_id")
	batch := flag.Int("batch", galgameClient.CatalogWorksIDsMax, "galgame ids per meta call (max 100)")
	flag.Parse()

	if *batch <= 0 || *batch > galgameClient.CatalogWorksIDsMax {
		// The meta face answers 400 above its ceiling rather than truncating, so
		// an over-large batch would fail loudly — clamp anyway so the flag can
		// never turn a backfill into a wall of 400s.
		*batch = galgameClient.CatalogWorksIDsMax
	}

	cfg := config.Load()
	if cfg.NextMoeAPI.BaseURL == "" || cfg.NextMoeAPI.APIKey == "" {
		slog.Error("KUN_NEXTMOE_API_BASE / KUN_NEXTMOE_API_KEY 未配置，无法读取归属元信息")
		os.Exit(1)
	}
	db := database.NewPostgres(cfg.Database, cfg.Server.Mode)
	gal := galgameClient.NewWithKey(cfg.NextMoeAPI.BaseURL, cfg.NextMoeAPI.APIKey)

	q := db.Model(&patchModel.Patch{}).Order("id")
	if !*force {
		q = q.Where("creator_id IS NULL")
	}
	var ids []int
	if err := q.Pluck("id", &ids).Error; err != nil {
		slog.Error("拉取候选 patch id 失败", "error", err)
		os.Exit(1)
	}
	slog.Info("候选", "count", len(ids), "apply", *apply, "force", *force)
	if len(ids) == 0 {
		return
	}

	ctx := context.Background()
	var resolved, missing, failed, written int
	for start := 0; start < len(ids); start += *batch {
		end := min(start+*batch, len(ids))
		chunk := ids[start:end]

		metas, err := gal.GetGalgameMeta(ctx, chunk)
		if err != nil {
			slog.Warn("meta 读取失败，跳过该批", "from", chunk[0], "to", chunk[len(chunk)-1], "error", err)
			failed += len(chunk)
			continue
		}
		byGID := make(map[int]int, len(metas))
		for i := range metas {
			byGID[metas[i].GID] = metas[i].UserID
		}
		for _, id := range chunk {
			uid, ok := byGID[id]
			if !ok || uid <= 0 {
				// The wiki has no entry for this gid any more (deleted/merged),
				// or it never recorded an author. Leave the column null: "we do
				// not know" is the honest value and the badge falls back.
				missing++
				continue
			}
			resolved++
			if !*apply {
				continue
			}
			res := db.Model(&patchModel.Patch{}).Where("id = ?", id).Update("creator_id", uid)
			if res.Error != nil {
				slog.Warn("写入失败", "galgame_id", id, "error", res.Error)
				failed++
				continue
			}
			written += int(res.RowsAffected)
		}
		// The meta face is a credentialed read on a live service; pace the walk
		// so a 60k-row backfill does not look like an incident.
		time.Sleep(50 * time.Millisecond)
	}
	slog.Info("完成", "resolved", resolved, "written", written, "missing", missing, "failed", failed, "apply", *apply)
}
