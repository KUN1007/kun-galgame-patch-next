package app

import (
	"log/slog"

	adminHandler "kun-galgame-patch-api/internal/admin/handler"
	adminRepo "kun-galgame-patch-api/internal/admin/repository"
	adminService "kun-galgame-patch-api/internal/admin/service"
	authHandler "kun-galgame-patch-api/internal/auth/handler"
	authRepo "kun-galgame-patch-api/internal/auth/repository"
	authService "kun-galgame-patch-api/internal/auth/service"
	"kun-galgame-patch-api/internal/common"
	"kun-galgame-patch-api/internal/infrastructure/cache"
	cronJobs "kun-galgame-patch-api/internal/infrastructure/cron"
	"kun-galgame-patch-api/internal/infrastructure/database"
	"kun-galgame-patch-api/internal/infrastructure/mail"
	"kun-galgame-patch-api/internal/infrastructure/storage"
	messageHandler "kun-galgame-patch-api/internal/message/handler"
	messageRepo "kun-galgame-patch-api/internal/message/repository"
	messageService "kun-galgame-patch-api/internal/message/service"
	metadataHandler "kun-galgame-patch-api/internal/metadata/handler"
	metadataRepo "kun-galgame-patch-api/internal/metadata/repository"
	metadataService "kun-galgame-patch-api/internal/metadata/service"
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
	Fiber  *fiber.App
	DB     *gorm.DB
	RDB    *redis.Client
	S3     *storage.S3Client
	Mailer *mail.Mailer
	Config *config.Config

	// Handlers
	AuthHandler     *authHandler.AuthHandler
	PatchHandler    *patchHandler.PatchHandler
	UserHandler     *userHandler.UserHandler
	MessageHandler  *messageHandler.MessageHandler
	AdminHandler    *adminHandler.AdminHandler
	MetadataHandler *metadataHandler.MetadataHandler
	CommonHandler   *common.CommonHandler
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
	authHdl := authHandler.New(authSvc, rdb, db)

	// Patch module
	patchRepository := patchRepo.New(db)
	patchSvc := patchService.New(patchRepository, rdb, db)
	patchHdl := patchHandler.New(patchSvc)

	// User module
	userRepository := userRepo.New(db)
	userSvc := userService.New(userRepository, authSvc)
	userHdl := userHandler.New(userSvc)

	// Message module
	messageRepository := messageRepo.New(db)
	messageSvc := messageService.New(messageRepository)
	messageHdl := messageHandler.New(messageSvc)

	// Admin module
	adminRepository := adminRepo.New(db)
	adminSvc := adminService.New(adminRepository, rdb)
	adminHdl := adminHandler.New(adminSvc)

	// Metadata module
	metadataRepository := metadataRepo.New(db)
	metadataSvc := metadataService.New(metadataRepository)
	metadataHdl := metadataHandler.New(metadataSvc)

	// Common handler (direct DB access for simple aggregation endpoints)
	commonHdl := common.NewHandler(db)

	// Fiber app
	app := fiber.New(fiber.Config{
		BodyLimit:    10 * 1024 * 1024, // 10MB
		ErrorHandler: globalErrorHandler,
	})

	app.Use(recover.New())
	app.Use(middleware.CORS(cfg.CORS))

	// Start cron jobs
	cronJobs.Start(db)

	slog.Info("Application initialized")

	return &App{
		Fiber:           app,
		DB:              db,
		RDB:             rdb,
		S3:              s3,
		Mailer:          mailer,
		Config:          cfg,
		AuthHandler:     authHdl,
		PatchHandler:    patchHdl,
		UserHandler:     userHdl,
		MessageHandler:  messageHdl,
		AdminHandler:    adminHdl,
		MetadataHandler: metadataHdl,
		CommonHandler:   commonHdl,
	}
}

func globalErrorHandler(c *fiber.Ctx, err error) error {
	if appErr, ok := err.(*errors.AppError); ok {
		return response.Error(c, appErr)
	}

	slog.Error("Unhandled error", "error", err, "path", c.Path())
	return response.Error(c, errors.ErrInternal(""))
}
