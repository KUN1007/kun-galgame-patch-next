package app

import (
	"log/slog"

	authHandler "kun-galgame-patch-api/internal/auth/handler"
	authRepo "kun-galgame-patch-api/internal/auth/repository"
	authService "kun-galgame-patch-api/internal/auth/service"
	"kun-galgame-patch-api/internal/infrastructure/cache"
	"kun-galgame-patch-api/internal/infrastructure/database"
	"kun-galgame-patch-api/internal/infrastructure/mail"
	"kun-galgame-patch-api/internal/infrastructure/storage"
	"kun-galgame-patch-api/internal/middleware"
	patchHandler "kun-galgame-patch-api/internal/patch/handler"
	patchRepo "kun-galgame-patch-api/internal/patch/repository"
	patchService "kun-galgame-patch-api/internal/patch/service"
	userHandler "kun-galgame-patch-api/internal/user/handler"
	userRepo "kun-galgame-patch-api/internal/user/repository"
	userService "kun-galgame-patch-api/internal/user/service"
	"kun-galgame-patch-api/pkg/config"
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/response"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type App struct {
	Fiber   *fiber.App
	DB      *gorm.DB
	RDB     *redis.Client
	S3      *storage.S3Client
	Mailer  *mail.Mailer
	Config  *config.Config

	// Handlers
	AuthHandler  *authHandler.AuthHandler
	PatchHandler *patchHandler.PatchHandler
	UserHandler  *userHandler.UserHandler
}

func New(cfg *config.Config) *App {
	// Infrastructure
	db := database.NewPostgres(cfg.Database, cfg.Server.Mode)
	rdb := cache.NewRedis(cfg.Redis)
	s3 := storage.NewS3(cfg.S3)
	mailer := mail.NewMailer(cfg.Mail)

	// Auth module
	authRepository := authRepo.New(db)
	authSvc := authService.New(authRepository, rdb, mailer, cfg.OAuth)
	authHdl := authHandler.New(authSvc, rdb)

	// Patch module
	patchRepository := patchRepo.New(db)
	patchSvc := patchService.New(patchRepository, rdb, db)
	patchHdl := patchHandler.New(patchSvc)

	// User module
	userRepository := userRepo.New(db)
	userSvc := userService.New(userRepository, authSvc)
	userHdl := userHandler.New(userSvc)

	// Fiber app
	app := fiber.New(fiber.Config{
		BodyLimit:    10 * 1024 * 1024, // 10MB
		ErrorHandler: globalErrorHandler,
	})

	app.Use(recover.New())
	app.Use(middleware.CORS(cfg.CORS))

	slog.Info("Application initialized")

	return &App{
		Fiber:       app,
		DB:          db,
		RDB:         rdb,
		S3:          s3,
		Mailer:      mailer,
		Config:      cfg,
		AuthHandler:  authHdl,
		PatchHandler: patchHdl,
		UserHandler:  userHdl,
	}
}

func globalErrorHandler(c *fiber.Ctx, err error) error {
	if appErr, ok := err.(*errors.AppError); ok {
		return response.Error(c, appErr)
	}

	slog.Error("Unhandled error", "error", err, "path", c.Path())
	return response.Error(c, errors.ErrInternal(""))
}
