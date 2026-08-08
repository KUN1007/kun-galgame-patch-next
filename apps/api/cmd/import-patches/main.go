package main

import (
	"bufio"
	"context"
	"flag"
	"log/slog"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"strings"

	galgameClient "kun-galgame-patch-api/internal/galgame/client"
	"kun-galgame-patch-api/internal/infrastructure/database"
	patchRepo "kun-galgame-patch-api/internal/patch/repository"
	"kun-galgame-patch-api/pkg/artifactclient"
	"kun-galgame-patch-api/pkg/config"
	"kun-galgame-patch-api/pkg/logger"

	"github.com/joho/godotenv"
)

var allowedExts = []string{".zip", ".rar", ".7z"}

func main() {
	_ = godotenv.Load()

	dir := flag.String("dir", "./patch", "directory of patch archives to import")
	deleteList := flag.String("delete-list", "", "path to a delete_list.txt of superseded filenames to remove (runs before import)")
	dryRun := flag.Bool("dry-run", false, "probe only: parse + catalog-check + dedup, no upload/write/delete")
	userID := flag.Int("user-id", 2310, "archive account user_id that owns the imported patches/resources")
	vndbFilter := flag.String("vndb", "", "comma-separated VNDB ids to restrict imports to (e.g. v14,v36)")
	limit := flag.Int("limit", 0, "process at most N recognized files (0 = all; for testing)")
	flag.Parse()

	cfg := config.Load()
	logger.Init(cfg.Server.Mode)

	only := map[string]bool{}
	for v := range strings.SplitSeq(*vndbFilter, ",") {
		if v = strings.TrimSpace(v); v != "" {
			only[v] = true
		}
	}

	if cfg.NextMoeAPI.APIKey == "" {
		slog.Error("KUN_NEXTMOE_API_KEY is required: the catalog galgame read face is gated by the internal-tier key")
		os.Exit(1)
	}

	db := database.NewPostgres(cfg.Database, cfg.Server.Mode)
	galgame := galgameClient.NewWithKey(cfg.NextMoeAPI.BaseURL, cfg.NextMoeAPI.APIKey)

	artCfg := cfg.Artifact
	if artCfg.ClientID == "" {
		artCfg.ClientID = cfg.OAuth.ClientID
	}
	if artCfg.ClientSecret == "" {
		artCfg.ClientSecret = cfg.OAuth.ClientSecret
	}
	art := artifactclient.New(artifactclient.Config{
		BaseURL:      artCfg.BaseURL,
		ClientID:     artCfg.ClientID,
		ClientSecret: artCfg.ClientSecret,
	})
	if !art.Configured() {
		slog.Error("artifact client not configured (missing base URL or credentials)")
		os.Exit(1)
	}

	imp := &Importer{db: db, repo: patchRepo.New(db), galgame: galgame, art: art, userID: *userID, dryRun: *dryRun, touched: map[int]struct{}{}}

	ctx := context.Background()
	counts := map[status]int{}
	var catalogMissing, failed []fileResult
	tally := func(phase string, r fileResult) {
		counts[r.status]++
		switch r.status {
		case statusCatalogMissing:
			catalogMissing = append(catalogMissing, r)
		case statusFailed:
			failed = append(failed, r)
		}
		slog.Info(phase, "status", r.status, "file", r.file, "detail", r.msg)
	}

	if *deleteList != "" {
		f, err := os.Open(*deleteList)
		if err != nil {
			slog.Error("open delete-list failed", "path", *deleteList, "err", err)
			os.Exit(1)
		}
		sc := bufio.NewScanner(f)
		sc.Buffer(make([]byte, 1024*1024), 1024*1024)
		for sc.Scan() {
			line := sc.Text()
			if strings.TrimSpace(line) == "" {
				continue
			}
			tally("delete", imp.processDelete(ctx, line))
		}
		_ = f.Close()
		if err := sc.Err(); err != nil {
			slog.Error("read delete-list failed", "err", err)
			os.Exit(1)
		}
	}

	entries, err := os.ReadDir(*dir)
	if err != nil {
		if *deleteList != "" {
			slog.Warn("skipping import phase: cannot read --dir", "dir", *dir, "err", err)
		} else {
			slog.Error("read dir failed", "dir", *dir, "err", err)
			os.Exit(1)
		}
	}
	processed := 0
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		name := e.Name()
		if !slices.Contains(allowedExts, strings.ToLower(filepath.Ext(name))) {
			continue
		}
		path := filepath.Join(*dir, name)

		if len(only) > 0 {
			p := parsePatchFileName(path)
			if p == nil || !only[p.VndbID] {
				continue
			}
		}
		if *limit > 0 && processed >= *limit {
			break
		}
		processed++
		tally("import", imp.processFile(ctx, path))
	}

	if drafts := imp.unpublishedDrafts(ctx); len(drafts) > 0 {
		idList := make([]string, len(drafts))
		for i, id := range drafts {
			idList[i] = strconv.Itoa(id)
		}
		csv := strings.Join(idList, ",")
		slog.Warn("UNPUBLISHED catalog drafts (status=2) — these galgames + their imported resources are INVISIBLE on moyu until published",
			"count", len(drafts), "galgame_ids", csv)
		slog.Warn("remediation 1/2 — on the catalog galgame DB (prod: kun_catalog; local dev: kun_galgame_wiki) run:",
			"sql", "UPDATE galgame SET status=0 WHERE id IN ("+csv+") AND status=2;")
		slog.Warn("remediation 2/2 — REQUIRED, the raw UPDATE bypasses the edit engine's reindex hook:",
			"cmd", "reindex-search --index=galgames")
	}

	slog.Info("summary",
		"ok", counts[statusOK], "dry-run", counts[statusDryRun], "skipped", counts[statusSkipped],
		"unrecognized", counts[statusUnrecognized], "catalog-missing", counts[statusCatalogMissing],
		"failed", counts[statusFailed])

	if len(catalogMissing) > 0 {
		slog.Warn("VNDB ids not found in the catalog (need manual review):")
		for _, r := range catalogMissing {
			slog.Warn("  catalog-missing", "file", r.file, "detail", r.msg)
		}
	}
	if len(failed) > 0 {
		for _, r := range failed {
			slog.Error("  failed", "file", r.file, "detail", r.msg)
		}
		os.Exit(1)
	}
}
