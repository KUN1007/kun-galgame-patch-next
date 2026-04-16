package handler

import (
	"encoding/json"
	"log/slog"
	"time"

	"kun-galgame-patch-api/internal/auth/dto"
	authModel "kun-galgame-patch-api/internal/auth/model"
	"kun-galgame-patch-api/internal/auth/service"
	"kun-galgame-patch-api/internal/middleware"
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/response"
	"kun-galgame-patch-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type AuthHandler struct {
	service *service.AuthService
	rdb     *redis.Client
	db      *gorm.DB
}

func New(svc *service.AuthService, rdb *redis.Client, db *gorm.DB) *AuthHandler {
	return &AuthHandler{service: svc, rdb: rdb, db: db}
}

// OAuthCallback POST /api/auth/oauth/callback
func (h *AuthHandler) OAuthCallback(c *fiber.Ctx) error {
	var req dto.OAuthCallbackRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	// 1. Exchange code for tokens
	tokenResp, err := h.service.ExchangeCode(req.Code, req.CodeVerifier)
	if err != nil {
		slog.Error("OAuth code exchange failed", "error", err)
		return response.Error(c, errors.ErrBadRequest("OAuth authentication failed"))
	}

	// 2. Get user info from OAuth
	userInfo, err := h.service.GetUserInfo(tokenResp.AccessToken)
	if err != nil {
		slog.Error("OAuth get userinfo failed", "error", err)
		return response.Error(c, errors.ErrBadRequest("failed to get user info"))
	}

	// 3. Find or create local user
	user, err := h.service.FindOrCreateUser(userInfo)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	// 4. Create session
	session := &middleware.SessionData{
		UserInfo: middleware.UserInfo{
			UID:   user.ID,
			Sub:   userInfo.Sub,
			Name:  user.Name,
			Email: user.Email,
			Role:  user.Role,
		},
		OAuthAccessToken:  tokenResp.AccessToken,
		OAuthRefreshToken: tokenResp.RefreshToken,
		OAuthExpiresAt:    time.Now().Unix() + tokenResp.ExpiresIn,
	}

	if err := middleware.CreateSession(c, h.rdb, session); err != nil {
		slog.Error("Create session failed", "error", err)
		return response.Error(c, errors.ErrInternal(""))
	}

	return response.OK(c, dto.MeResponse{
		UID:             user.ID,
		Name:            user.Name,
		Avatar:          user.Avatar,
		Bio:             user.Bio,
		Moemoepoint:     user.Moemoepoint,
		Role:            user.Role,
		DailyCheckIn:    user.DailyCheckIn,
		DailyImageCount: user.DailyImageCount,
		DailyUploadSize: user.DailyUploadSize,
	})
}

// Logout POST /api/auth/logout
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	// Revoke OAuth token if available
	sessionID := c.Cookies(middleware.SessionCookieName)
	if sessionID != "" {
		// Try to get session to revoke OAuth token
		data, err := h.rdb.Get(c.Context(), middleware.SessionPrefix+sessionID).Result()
		if err == nil {
			var session middleware.SessionData
			if json_err := parseJSON(data, &session); json_err == nil && session.OAuthAccessToken != "" {
				go h.service.RevokeOAuthToken(session.OAuthAccessToken)
			}
		}
	}

	middleware.DestroySession(c, h.rdb)
	return response.OKMessage(c, "Logged out")
}

// Me GET /api/auth/me
func (h *AuthHandler) Me(c *fiber.Ctx) error {
	sessionUser := middleware.MustGetUser(c)

	// Fetch full user from DB for up-to-date info
	var user authModel.User
	if err := h.db.First(&user, sessionUser.UID).Error; err != nil {
		return response.Error(c, errors.ErrNotFound("user not found"))
	}

	// Update last login time in background
	go func() {
		h.db.Model(&authModel.User{}).Where("id = ?", user.ID).
			Update("last_login_time", time.Now().Format(time.RFC3339))
	}()

	return response.OK(c, dto.MeResponse{
		UID:             user.ID,
		Name:            user.Name,
		Avatar:          user.Avatar,
		Bio:             user.Bio,
		Moemoepoint:     user.Moemoepoint,
		Role:            user.Role,
		DailyCheckIn:    user.DailyCheckIn,
		DailyImageCount: user.DailyImageCount,
		DailyUploadSize: user.DailyUploadSize,
	})
}

// ForgotSendCode POST /api/auth/forgot/send-code
func (h *AuthHandler) ForgotSendCode(c *fiber.Ctx) error {
	var req dto.ForgotSendCodeRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	if err := h.service.SendVerificationCode(req.Name); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OKMessage(c, "Verification code sent")
}

// ForgotReset POST /api/auth/forgot/reset
func (h *AuthHandler) ForgotReset(c *fiber.Ctx) error {
	var req dto.ForgotResetRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	if err := h.service.VerifyCode(req.Name, req.VerificationCode); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OKMessage(c, "Password has been reset")
}

// SendEmailCode POST /api/auth/email/send-code
func (h *AuthHandler) SendEmailCode(c *fiber.Ctx) error {
	var req dto.SendEmailCodeRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	if err := h.service.SendVerificationCode(req.Email); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OKMessage(c, "Verification code sent")
}

func parseJSON(data string, v any) error {
	return json.Unmarshal([]byte(data), v)
}
