package handler

import (
	"encoding/json"

	"kun-galgame-patch-api/internal/middleware"
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/response"

	"github.com/gofiber/fiber/v3"
)

func (h *UserHandler) CreatorStatus(c fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	token := middleware.GetAccessToken(c)
	if userID == 0 || token == "" {
		return response.Error(c, errors.ErrUnauthorized())
	}
	elig, app, appErr := h.service.CreatorStatus(c.Context(), userID, token)
	if appErr != nil {
		return response.Error(c, appErr)
	}
	return response.OK(c, fiber.Map{"eligibility": elig, "application": app})
}

func (h *UserHandler) CreatorApply(c fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	token := middleware.GetAccessToken(c)
	if userID == 0 || token == "" {
		return response.Error(c, errors.ErrUnauthorized())
	}
	var body struct {
		Message string `json:"message"`
	}
	_ = json.Unmarshal(c.Body(), &body)
	app, appErr := h.service.ApplyCreator(c.Context(), userID, token, body.Message)
	if appErr != nil {
		return response.Error(c, appErr)
	}
	return response.OK(c, app)
}
