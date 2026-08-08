package main

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"os/exec"
	"path"
	"regexp"
	"sort"
	"strings"
	"time"

	"kun-galgame-patch-api/internal/infrastructure/database"
	"kun-galgame-patch-api/pkg/config"
	"kun-galgame-patch-api/pkg/imageclient"
	"kun-galgame-patch-api/pkg/logger"

	"github.com/joho/godotenv"
)

var legacyImageRe = regexp.MustCompile(`https?://image\.moyu\.moe/[^\s)"'>\]\\]+`)

const trailingPunct = `.,;!?，。、）】>`

type target struct{ table, col string }

func main() {
	_ = godotenv.Load()

	dryRun := flag.Bool("dry-run", true, "TRUE (default): scan + report workload only, no network, no DB writes. Pass -dry-run=false to apply.")
	base := flag.String("base", "https://image.moyu.moe", "Base to HTTP-fetch legacy originals from (override if the old host isn't reachable from here)")
	limit := flag.Int("limit", 0, "Max rows per table (0 = all); for smoke-testing -dry-run=false on a small batch")
	preset := flag.String("preset", "topic", "image_service preset to rehost under")
	backupPath := flag.String("backup", "migrate-content-images-backup.jsonl", "JSONL file to append original rows to before rewriting (recoverability)")
	tablesFlag := flag.String("tables", "patch_comment:content,patch_resource:note", "comma-separated table:column list to scan/rewrite")
	flag.Parse()

	var targets []target
	for _, t := range strings.Split(*tablesFlag, ",") {
		t = strings.TrimSpace(t)
		if t == "" {
			continue
		}
		parts := strings.SplitN(t, ":", 2)
		if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
			slog.Error("非法 -tables 项 (需 table:column)", "item", t)
			os.Exit(1)
		}
		targets = append(targets, target{parts[0], parts[1]})
	}
	if len(targets) == 0 {
		slog.Error("-tables 为空")
		os.Exit(1)
	}

	cfg := config.Load()
	logger.Init(cfg.Server.Mode)

	imgCfg := cfg.ImageService
	if imgCfg.ClientID == "" {
		imgCfg.ClientID = cfg.OAuth.ClientID
	}
	if imgCfg.ClientSecret == "" {
		imgCfg.ClientSecret = cfg.OAuth.ClientSecret
	}
	img := imageclient.New(imageclient.Config{
		BaseURL:      imgCfg.BaseURL,
		CDNBase:      imgCfg.CDNBase,
		ClientID:     imgCfg.ClientID,
		ClientSecret: imgCfg.ClientSecret,
	})

	if !*dryRun {
		if !img.Configured() {
			slog.Error("image_service 未配置 (KUN_IMAGE_SERVICE_BASE_URL / client_id / secret), 无法上传")
			os.Exit(1)
		}
		if _, err := exec.LookPath("ffmpeg"); err != nil {
			slog.Error("未找到 ffmpeg (AVIF 解码需要它); 请先安装", "error", err)
			os.Exit(1)
		}
	}

	db := database.NewPostgres(cfg.Database, cfg.Server.Mode)
	httpClient := &http.Client{Timeout: 60 * time.Second}
	ctx := context.Background()

	migrated := map[string]string{}
	dead := map[string]bool{}
	seen := map[string]bool{}
	deadList := []string{}
	perTableRows := map[string]int{}

	var backup *os.File
	if !*dryRun {
		f, err := os.OpenFile(*backupPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
		if err != nil {
			slog.Error("打开备份文件失败", "path", *backupPath, "error", err)
			os.Exit(1)
		}
		defer f.Close()
		backup = f
	}

	var rowsUpdated, rowsSkipped, replacements, uploads int

	slog.Info("开始迁移 content 老图", "dry_run", *dryRun, "base", *base, "preset", *preset, "limit", *limit, "backup", *backupPath)

	for _, t := range targets {
		type row struct {
			ID      int64
			Content string
		}
		var rows []row
		q := db.Table(t.table).
			Select("id, "+t.col+" AS content").
			Where(t.col+" LIKE ?", "%image.moyu.moe%").
			Order("id ASC")
		if *limit > 0 {
			q = q.Limit(*limit)
		}
		if err := q.Scan(&rows).Error; err != nil {
			slog.Error("扫描失败", "table", t.table, "error", err)
			os.Exit(1)
		}
		perTableRows[t.table] = len(rows)
		slog.Info("扫描完成", "table", t.table, "含老图行数", len(rows))

		for _, r := range rows {
			urls := extractLegacyURLs(r.Content)
			newContent := r.Content
			rowReplaced := 0

			for _, old := range urls {
				seen[old] = true
				if dead[old] {
					continue
				}
				if *dryRun {
					continue
				}
				token, done := migrated[old]
				if !done {
					data, ferr := fetch(ctx, httpClient, rewriteHost(old, *base))
					if ferr != nil {
						slog.Warn("抓取原图失败, 跳过(保留旧 URL)", "url", old, "error", ferr)
						dead[old] = true
						deadList = append(deadList, old)
						continue
					}
					body, fname, cerr := toUploadable(ctx, data, old)
					if cerr != nil {
						slog.Warn("转码失败, 跳过(保留旧 URL)", "url", old, "error", cerr)
						dead[old] = true
						deadList = append(deadList, old)
						continue
					}
					res, uerr := img.Upload(ctx, bytes.NewReader(body), fname, "", *preset)
					if uerr != nil {
						slog.Error("上传 image_service 失败, 跳过", "url", old, "error", uerr)
						dead[old] = true
						deadList = append(deadList, old)
						continue
					}
					token = "/image/" + res.Hash
					migrated[old] = token
					uploads++
					slog.Info("已重托管", "old", old, "token", token, "dedup", res.Deduplicated)
					if uploads%50 == 0 {
						slog.Info("进度", "已重托管去重老图", uploads, "失败/404", len(dead))
					}
				}
				if token != "" && token != old {
					n := strings.Count(newContent, old)
					newContent = strings.ReplaceAll(newContent, old, token)
					rowReplaced += n
				}
			}

			if *dryRun || rowReplaced == 0 {
				if !*dryRun {
					rowsSkipped++
				}
				continue
			}

			if err := writeBackup(backup, t.table, r.ID, r.Content); err != nil {
				slog.Error("写备份失败, 跳过该行(不改写)", "table", t.table, "id", r.ID, "error", err)
				rowsSkipped++
				continue
			}
			if err := db.Exec(
				"UPDATE "+t.table+" SET "+t.col+" = ? WHERE id = ?",
				newContent, r.ID,
			).Error; err != nil {
				slog.Error("更新行失败", "table", t.table, "id", r.ID, "error", err)
				rowsSkipped++
				continue
			}
			rowsUpdated++
			replacements += rowReplaced
			slog.Info("已改写", "table", t.table, "id", r.ID, "替换处数", rowReplaced)
		}
	}

	if *dryRun {
		fmt.Printf("dry-run 完成。去重老图文件 %d 张待迁移。各表含老图行数: ", len(seen))
		for _, t := range targets {
			fmt.Printf("%s=%d ", t.table, perTableRows[t.table])
		}
		fmt.Printf("\n加 -dry-run=false 执行(顺序跑, 每张 fetch+ffmpeg+upload)。\n")
		return
	}

	slog.Info("迁移完成",
		"重托管去重老图", len(migrated), "改写行数", rowsUpdated, "替换处数", replacements,
		"跳过行数", rowsSkipped, "失败/404老图", len(dead))
	if len(deadList) > 0 {
		sort.Strings(deadList)
		slog.Warn("以下老图取不到/转码失败, 已保留旧 URL, 需人工跟进或忽略", "count", len(deadList), "urls", deadList)
	}
	fmt.Printf("迁移完成: 重托管 %d 张, 改写 %d 行(%d 处), 跳过 %d 行, 失败 %d 张。备份: %s\n",
		len(migrated), rowsUpdated, replacements, rowsSkipped, len(dead), *backupPath)
}

func extractLegacyURLs(content string) []string {
	raw := legacyImageRe.FindAllString(content, -1)
	out := make([]string, 0, len(raw))
	for _, u := range raw {
		out = append(out, strings.TrimRight(u, trailingPunct))
	}
	return dedupe(out)
}

func rewriteHost(url, base string) string {
	if base == "" || base == "https://image.moyu.moe" {
		return url
	}
	return strings.Replace(url, "https://image.moyu.moe", strings.TrimRight(base, "/"), 1)
}

func dedupe(in []string) []string {
	seen := map[string]bool{}
	var out []string
	for _, s := range in {
		if !seen[s] {
			seen[s] = true
			out = append(out, s)
		}
	}
	sort.Strings(out)
	return out
}

func fetch(ctx context.Context, c *http.Client, url string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d", resp.StatusCode)
	}
	return io.ReadAll(io.LimitReader(resp.Body, 32<<20))
}

func toUploadable(ctx context.Context, data []byte, srcURL string) ([]byte, string, error) {
	if !isAVIF(data) {
		return data, path.Base(srcURL), nil
	}
	png, err := avifToPNG(ctx, data)
	if err != nil {
		return nil, "", err
	}
	return png, "content.png", nil
}

func isAVIF(b []byte) bool {
	if len(b) < 12 || string(b[4:8]) != "ftyp" {
		return false
	}
	if brand := string(b[8:12]); brand == "avif" || brand == "avis" {
		return true
	}
	for i := 16; i+4 <= len(b) && i < 64; i += 4 {
		if string(b[i:i+4]) == "avif" {
			return true
		}
	}
	return false
}

func avifToPNG(ctx context.Context, avif []byte) ([]byte, error) {
	cctx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	in, err := os.CreateTemp("", "moyu-avif-*.avif")
	if err != nil {
		return nil, err
	}
	defer os.Remove(in.Name())
	if _, err := in.Write(avif); err != nil {
		in.Close()
		return nil, err
	}
	in.Close()

	cmd := exec.CommandContext(cctx, "ffmpeg",
		"-hide_banner", "-loglevel", "error", "-y",
		"-i", in.Name(), "-frames:v", "1", "-f", "image2", "-c:v", "png", "pipe:1")
	var out, errBuf bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &errBuf
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("ffmpeg: %w (%s)", err, strings.TrimSpace(errBuf.String()))
	}
	if out.Len() == 0 {
		return nil, fmt.Errorf("ffmpeg produced no output")
	}
	return out.Bytes(), nil
}

func writeBackup(f *os.File, table string, id int64, content string) error {
	rec, err := json.Marshal(struct {
		Table   string `json:"table"`
		ID      int64  `json:"id"`
		Content string `json:"content"`
	}{table, id, content})
	if err != nil {
		return err
	}
	_, err = f.Write(append(rec, '\n'))
	return err
}
