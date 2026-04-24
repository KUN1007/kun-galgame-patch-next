// cmd/migrate looks for `NNN_name.{up,down}.sql` files under migrations/,
// executes them in prefix order, and records applied migrations in `_migrations`.
//
// Usage examples:
//
//	go run ./cmd/migrate                     # run all pending up migrations
//	go run ./cmd/migrate -dir=down -step=1   # roll back the last migration
//	go run ./cmd/migrate -only=001           # run only 001
//	go run ./cmd/migrate -exclude=005,006    # skip 005/006
//	go run ./cmd/migrate -yes                # skip confirmation prompt
package main

import (
	"bufio"
	"database/sql"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"kun-galgame-patch-api/internal/infrastructure/database"
	"kun-galgame-patch-api/pkg/config"
	"kun-galgame-patch-api/pkg/logger"

	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	direction := flag.String("dir", "up", "迁移方向：up 或 down")
	step := flag.Int("step", 0, "执行迁移的数量（0 = 全部）")
	migrationsDir := flag.String("path", "migrations", "迁移文件目录")
	exclude := flag.String("exclude", "", "逗号分隔的跳过前缀，例如 '005,006'")
	only := flag.String("only", "", "逗号分隔的仅执行前缀，例如 '001'")
	autoYes := flag.Bool("yes", false, "跳过确认提示（CI 用）")
	flag.Parse()

	if *direction != "up" && *direction != "down" {
		fmt.Fprintf(os.Stderr, "错误：-dir 只接受 up 或 down，得到 %q\n", *direction)
		os.Exit(2)
	}

	excludeSet := parseSet(*exclude)
	onlySet := parseSet(*only)

	cfg := config.Load()
	logger.Init(cfg.Server.Mode)

	db := database.NewPostgres(cfg.Database, cfg.Server.Mode)
	sqlDB, err := db.DB()
	if err != nil {
		slog.Error("获取数据库连接失败", "error", err)
		os.Exit(1)
	}

	if err := ensureTracker(sqlDB); err != nil {
		slog.Error("创建迁移跟踪表失败", "error", err)
		os.Exit(1)
	}

	applied, err := loadApplied(sqlDB)
	if err != nil {
		slog.Error("查询已应用迁移失败", "error", err)
		os.Exit(1)
	}

	files, err := collectFiles(*migrationsDir, *direction)
	if err != nil {
		slog.Error("查找迁移文件失败", "error", err)
		os.Exit(1)
	}

	plan := buildPlan(files, *direction, *step, onlySet, excludeSet, applied)
	if len(plan) == 0 {
		fmt.Println("没有待执行的迁移")
		return
	}

	printPlan(plan, *direction, redactURL(cfg.Database.URL))

	if !*autoYes && !confirm() {
		fmt.Println("已取消")
		return
	}

	ran := 0
	for _, p := range plan {
		if err := runOne(sqlDB, p, *direction); err != nil {
			slog.Error("执行迁移失败", "file", p.base, "error", err)
			os.Exit(1)
		}
		ran++
		slog.Info("迁移完成", "file", p.base)
	}

	fmt.Printf("✅ 成功执行 %d 个迁移\n", ran)
}

// ─── helpers ─────────────────────────────────────────────

type migration struct {
	path string // full file path
	base string // basename (e.g. 001_drop.up.sql)
	name string // without direction suffix (e.g. 001_drop)
}

func parseSet(csv string) map[string]bool {
	out := map[string]bool{}
	for p := range strings.SplitSeq(csv, ",") {
		p = strings.TrimSpace(p)
		if p != "" {
			out[p] = true
		}
	}
	return out
}

func ensureTracker(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS _migrations (
			id SERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL UNIQUE,
			applied_at TIMESTAMP NOT NULL DEFAULT NOW()
		)
	`)
	return err
}

func loadApplied(db *sql.DB) (map[string]bool, error) {
	rows, err := db.Query("SELECT name FROM _migrations ORDER BY id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := map[string]bool{}
	for rows.Next() {
		var n string
		if err := rows.Scan(&n); err != nil {
			return nil, err
		}
		out[n] = true
	}
	return out, rows.Err()
}

func collectFiles(dir, direction string) ([]string, error) {
	suffix := "." + direction + ".sql"
	files, err := filepath.Glob(filepath.Join(dir, "*"+suffix))
	if err != nil {
		return nil, err
	}
	sort.Strings(files)
	if direction == "down" {
		for i, j := 0, len(files)-1; i < j; i, j = i+1, j-1 {
			files[i], files[j] = files[j], files[i]
		}
	}
	return files, nil
}

func buildPlan(files []string, direction string, step int, only, exclude, applied map[string]bool) []migration {
	suffix := "." + direction + ".sql"
	var plan []migration
	for _, f := range files {
		base := filepath.Base(f)
		name := strings.TrimSuffix(base, suffix)
		prefix := strings.SplitN(name, "_", 2)[0]

		if len(only) > 0 {
			if !only[prefix] {
				continue
			}
		} else if exclude[prefix] {
			slog.Info("跳过迁移（excluded）", "file", base)
			continue
		}

		if direction == "up" && applied[name] {
			continue
		}
		if direction == "down" && !applied[name] {
			continue
		}

		plan = append(plan, migration{path: f, base: base, name: name})
		if step > 0 && len(plan) >= step {
			break
		}
	}
	return plan
}

func runOne(db *sql.DB, m migration, direction string) error {
	content, err := os.ReadFile(m.path)
	if err != nil {
		return fmt.Errorf("读取文件：%w", err)
	}
	if _, err := db.Exec(string(content)); err != nil {
		return fmt.Errorf("执行 SQL：%w", err)
	}
	if direction == "up" {
		_, err = db.Exec("INSERT INTO _migrations (name) VALUES ($1)", m.name)
	} else {
		_, err = db.Exec("DELETE FROM _migrations WHERE name = $1", m.name)
	}
	if err != nil {
		return fmt.Errorf("更新跟踪表：%w", err)
	}
	return nil
}

func printPlan(plan []migration, direction, dbURL string) {
	fmt.Println("──────────────────────────────────────────")
	fmt.Printf("方向     : %s\n", direction)
	fmt.Printf("数据库   : %s\n", dbURL)
	fmt.Printf("待执行   : %d 个迁移\n", len(plan))
	fmt.Println("──────────────────────────────────────────")
	for i, p := range plan {
		fmt.Printf("  %d. %s\n", i+1, p.base)
	}
	fmt.Println("──────────────────────────────────────────")
}

func confirm() bool {
	fmt.Print("确认执行？(y/N) ")
	scanner := bufio.NewScanner(os.Stdin)
	if !scanner.Scan() {
		return false
	}
	answer := strings.TrimSpace(strings.ToLower(scanner.Text()))
	return answer == "y" || answer == "yes"
}

// redactURL replaces the password in postgres://user:pass@host/db with ***
func redactURL(u string) string {
	at := strings.Index(u, "@")
	if at < 0 {
		return u
	}
	colon := strings.LastIndex(u[:at], ":")
	// Expect scheme://user:pass@... i.e. at least two colons
	scheme := strings.Index(u, "://")
	if colon < 0 || scheme < 0 || colon <= scheme+2 {
		return u
	}
	return u[:colon+1] + "***" + u[at:]
}
