package main

import (
	"bufio"
	"database/sql"
	_ "embed"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"strings"

	"kun-galgame-patch-api/internal/infrastructure/database"
	"kun-galgame-patch-api/pkg/config"
	"kun-galgame-patch-api/pkg/logger"

	"github.com/joho/godotenv"
)

//go:embed migration.sql
var migrationSQL string

const markerName = "oauth_prep_20260409"

func main() {
	_ = godotenv.Load()

	dryRun := flag.Bool("dry-run", false, "Print the SQL without executing")
	autoYes := flag.Bool("yes", false, "Skip confirmation prompt (CI)")
	force := flag.Bool("force", false, "Re-run even if the marker says it already ran")
	flag.Parse()

	cfg := config.Load()
	logger.Init(cfg.Server.Mode)

	if *dryRun {
		fmt.Print(migrationSQL)
		return
	}

	db := database.NewPostgres(cfg.Database, cfg.Server.Mode)
	sqlDB, err := db.DB()
	if err != nil {
		slog.Error("get db conn failed", "error", err)
		os.Exit(1)
	}

	if err := ensureTracker(sqlDB); err != nil {
		slog.Error("ensure tracker failed", "error", err)
		os.Exit(1)
	}

	if alreadyRan(sqlDB) {
		if !*force {
			fmt.Printf("oauth-prep already applied (marker: %s). Use -force to re-run.\n", markerName)
			return
		}
		fmt.Println("⚠️  -force: re-running despite existing marker")
	}

	printPlan(cfg)

	if !*autoYes && !confirm() {
		fmt.Println("Cancelled")
		return
	}

	if _, err := sqlDB.Exec(migrationSQL); err != nil {
		slog.Error("oauth-prep SQL failed", "error", err)
		os.Exit(1)
	}

	if _, err := sqlDB.Exec(
		`INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
		markerName,
	); err != nil {
		slog.Error("write marker failed", "error", err)
		os.Exit(1)
	}

	if _, err := sqlDB.Exec(
		`INSERT INTO _migrations (name) VALUES ('000_baseline') ON CONFLICT (name) DO NOTHING`,
	); err != nil {
		slog.Error("write baseline marker failed", "error", err)
		os.Exit(1)
	}

	fmt.Println("✅ oauth-prep applied (and 000_baseline marked as applied)")
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

func alreadyRan(db *sql.DB) bool {
	var n int
	_ = db.QueryRow("SELECT COUNT(*) FROM _migrations WHERE name = $1", markerName).Scan(&n)
	return n > 0
}

func printPlan(cfg *config.Config) {
	fmt.Println("──────────────────────────────────────────")
	fmt.Printf("Database : %s\n", redactURL(cfg.Database.URL))
	fmt.Println("Action   : OAuth integration prep (one-shot)")
	fmt.Printf("Marker   : %s\n", markerName)
	fmt.Printf("SQL size : %d bytes (~%d lines)\n", len(migrationSQL), strings.Count(migrationSQL, "\n"))
	fmt.Println("──────────────────────────────────────────")
	fmt.Println("This will, atomically:")
	fmt.Println("  1. NULL → '{}' on 16 text[] columns")
	fmt.Println("  2. Convert those 16 columns to jsonb")
	fmt.Println("  3. Add denormalized *_count fields and backfill them")
	fmt.Println("  4. Create the oauth_account table")
	fmt.Println("──────────────────────────────────────────")
}

func confirm() bool {
	fmt.Print("Apply? (y/N) ")
	scanner := bufio.NewScanner(os.Stdin)
	if !scanner.Scan() {
		return false
	}
	answer := strings.ToLower(strings.TrimSpace(scanner.Text()))
	return answer == "y" || answer == "yes"
}

func redactURL(u string) string {
	at := strings.Index(u, "@")
	if at < 0 {
		return u
	}
	colon := strings.LastIndex(u[:at], ":")
	scheme := strings.Index(u, "://")
	if colon < 0 || scheme < 0 || colon <= scheme+2 {
		return u
	}
	return u[:colon+1] + "***" + u[at:]
}
