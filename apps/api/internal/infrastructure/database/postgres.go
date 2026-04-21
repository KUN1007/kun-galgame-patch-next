package database

import (
	"log/slog"
	"time"

	"kun-galgame-patch-api/pkg/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

func NewPostgres(cfg config.DatabaseConfig, mode string) *gorm.DB {
	logLevel := gormlogger.Info
	if mode == "prod" {
		logLevel = gormlogger.Warn
	}

	db, err := gorm.Open(postgres.Open(cfg.URL), &gorm.Config{
		SkipDefaultTransaction: true,
		Logger: gormlogger.Default.LogMode(logLevel),
	})
	if err != nil {
		panic("failed to connect to database: " + err.Error())
	}

	sqlDB, err := db.DB()
	if err != nil {
		panic("failed to get underlying sql.DB: " + err.Error())
	}

	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetConnMaxLifetime(time.Duration(cfg.ConnMaxLifetime) * time.Minute)

	slog.Info("PostgreSQL connected")
	return db
}
