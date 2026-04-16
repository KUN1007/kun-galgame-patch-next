package cron

import (
	"log/slog"
	"os"
	"path/filepath"
	"time"

	"github.com/robfig/cron/v3"
	"gorm.io/gorm"
)

// Start initializes and starts all cron jobs
func Start(db *gorm.DB) {
	c := cron.New()

	// Daily reset at midnight: reset daily_image_count, daily_check_in, daily_upload_size
	c.AddFunc("0 0 * * *", func() {
		result := db.Table("user").Updates(map[string]any{
			"daily_image_count": 0,
			"daily_check_in":    0,
			"daily_upload_size": 0,
		})
		slog.Info("Daily reset completed", "rows_affected", result.RowsAffected)
	})

	// Hourly cleanup: remove temp upload files older than 24 hours
	c.AddFunc("0 * * * *", func() {
		uploadsDir := "uploads"
		if _, err := os.Stat(uploadsDir); os.IsNotExist(err) {
			return
		}

		cutoff := time.Now().Add(-24 * time.Hour)
		removed := 0

		filepath.Walk(uploadsDir, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return nil
			}
			if !info.IsDir() && info.ModTime().Before(cutoff) {
				os.Remove(path)
				removed++
			}
			return nil
		})

		// Remove empty directories
		filepath.Walk(uploadsDir, func(path string, info os.FileInfo, err error) error {
			if err != nil || !info.IsDir() || path == uploadsDir {
				return nil
			}
			entries, _ := os.ReadDir(path)
			if len(entries) == 0 {
				os.Remove(path)
			}
			return nil
		})

		if removed > 0 {
			slog.Info("Hourly cleanup completed", "files_removed", removed)
		}
	})

	c.Start()
	slog.Info("Cron jobs started")
}
