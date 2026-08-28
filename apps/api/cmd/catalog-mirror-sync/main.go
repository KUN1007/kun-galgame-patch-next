package main

import (
	"context"
	"log/slog"
	"os"
	"time"

	galgameClient "kun-galgame-patch-api/internal/galgame/client"
	"kun-galgame-patch-api/internal/infrastructure/cron"
	"kun-galgame-patch-api/internal/infrastructure/database"
	"kun-galgame-patch-api/pkg/config"
	"kun-galgame-patch-api/pkg/logger"

	"github.com/joho/godotenv"
)

// Drains the catalog changes feed to the end instead of stopping at the cron's
// per-tick page budget. The cron gets there on its own; this is for the first
// drain, which walks catalog's whole galgame population and would otherwise
// take a couple of hours of ticks.
func main() {
	_ = godotenv.Load()

	cfg := config.Load()
	logger.Init(cfg.Server.Mode)

	galgame := galgameClient.NewWithKey(cfg.NextMoeAPI.BaseURL, cfg.NextMoeAPI.APIKey)
	catalog := galgame.V2()
	if catalog == nil || !catalog.Configured() {
		slog.Error("catalog 未配置 (KUN_NEXTMOE_API_BASE / KUN_NEXTMOE_API_KEY)")
		os.Exit(1)
	}

	db := database.NewPostgres(cfg.Database, cfg.Server.Mode)

	ctx, cancel := context.WithTimeout(context.Background(), time.Hour)
	defer cancel()

	total := 0
	for {
		updated, caughtUp, err := cron.RunCatalogMirrorSync(ctx, db, catalog, galgame)
		total += updated
		if err != nil {
			slog.Error("catalog 展示轴同步失败", "error", err, "updated", total)
			os.Exit(1)
		}
		slog.Info("catalog 展示轴同步进行中", "updated", total, "caught_up", caughtUp)
		if caughtUp {
			break
		}
	}
	slog.Info("catalog 展示轴同步完成", "updated", total)
}
