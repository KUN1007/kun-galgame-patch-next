package handler

import (
	"encoding/json"
	"strconv"
	"time"

	"kun-galgame-patch-api/internal/middleware"
	"kun-galgame-patch-api/internal/trust/dto"
	"kun-galgame-patch-api/internal/trust/enforce"
	"kun-galgame-patch-api/internal/trust/service"
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/response"
	"kun-galgame-patch-api/pkg/trustclient"
	"kun-galgame-patch-api/pkg/utils"

	"github.com/gofiber/fiber/v3"
)

type TrustHandler struct {
	trustService   *service.TrustService
	enforce        *enforce.Service
	callbackSecret string
}

func NewTrustHandler(
	trustService *service.TrustService,
	enforceService *enforce.Service,
	callbackSecret string,
) *TrustHandler {
	return &TrustHandler{
		trustService:   trustService,
		enforce:        enforceService,
		callbackSecret: callbackSecret,
	}
}

func (h *TrustHandler) GetReasons(c fiber.Ctx) error {
	return response.OK(c, h.trustService.Reasons(c.Context()))
}

func (h *TrustHandler) SubmitReport(c fiber.Ctx) error {
	user := middleware.MustGetUser(c)

	var req dto.SubmitReportRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	res, appErr := h.trustService.SubmitReport(c.Context(), user.ID, &req)
	if appErr != nil {
		return response.Error(c, appErr)
	}
	return response.OK(c, res)
}

func (h *TrustHandler) Callback(c fiber.Ctx) error {
	body := c.Body()
	if !trustclient.VerifyCallbackSignature(
		h.callbackSecret,
		c.Get("X-Trust-Timestamp"),
		c.Get("X-Trust-Signature"),
		body,
		time.Now(),
	) {
		return response.Error(c, errors.ErrUnauthorized())
	}

	var cb dto.TrustCallback
	if err := json.Unmarshal(body, &cb); err != nil {
		return response.Error(c, errors.ErrBadRequest("回调内容无效"))
	}

	if err := h.enforce.Apply(c.Context(), cb); err != nil {
		return response.Error(c, errors.ErrInternal("处置执行失败"))
	}
	return response.OK(c, fiber.Map{"ok": true})
}

func (h *TrustHandler) ListReviewItems(c fiber.Ctx) error {
	req := &dto.ListReviewItemsRequest{
		Status: fiber.Query(c, "status", -1),
		Source: fiber.Query(c, "source", -1),
		Page:   max(fiber.Query(c, "page", 1), 1),
		Limit:  min(max(fiber.Query(c, "limit", 30), 1), 200),
	}
	data, appErr := h.trustService.ListReviewItems(c.Context(), middleware.GetAccessToken(c), req)
	if appErr != nil {
		return response.Error(c, appErr)
	}
	return response.OK(c, data)
}

func (h *TrustHandler) GetReviewItem(c fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest("无效的条目 ID"))
	}
	data, appErr := h.trustService.GetReviewItem(c.Context(), middleware.GetAccessToken(c), id)
	if appErr != nil {
		return response.Error(c, appErr)
	}
	return response.OK(c, data)
}

func (h *TrustHandler) ClaimReviewItem(c fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest("无效的条目 ID"))
	}
	data, appErr := h.trustService.ClaimReviewItem(c.Context(), middleware.GetAccessToken(c), id)
	if appErr != nil {
		return response.Error(c, appErr)
	}
	return response.OK(c, data)
}

func (h *TrustHandler) DecideReviewItem(c fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest("无效的条目 ID"))
	}
	data, appErr := h.trustService.DecideReviewItem(c.Context(), middleware.GetAccessToken(c), id, c.Body())
	if appErr != nil {
		return response.Error(c, appErr)
	}
	return response.OK(c, data)
}
