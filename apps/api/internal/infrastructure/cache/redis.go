package cache

import (
	"context"
	"fmt"
	"log/slog"

	"kun-galgame-patch-api/pkg/config"

	"github.com/redis/go-redis/v9"
)

func NewRedis(cfg config.RedisConfig) *redis.Client {
	rdb := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	if err := rdb.Ping(context.Background()).Err(); err != nil {
		panic("failed to connect to Redis: " + err.Error())
	}

	slog.Info("Redis connected")
	return rdb
}
