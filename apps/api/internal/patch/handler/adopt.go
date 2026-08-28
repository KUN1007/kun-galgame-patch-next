package handler

import (
	"log/slog"

	"kun-galgame-patch-api/internal/middleware"
	"kun-galgame-patch-api/pkg/catalogv2"

	"github.com/gofiber/fiber/v3"
)

func (h *PatchHandler) claimOnFirstResource(c fiber.Ctx, gid int) {
	token := middleware.GetAccessToken(c)
	if token == "" {
		return
	}
	workID, found, err := h.galgame.ResolveWorkID(c.Context(), gid)
	if err != nil || !found {
		slog.Warn("resource: 解析 catalog work 失败，跳过静默收录", "gid", gid, "error", err)
		return
	}
	if appErr := adoptAndPublish(c, h.catalogV2(), token, workID); appErr != nil {
		slog.Warn("resource: 静默收录 catalog 作品失败", "gid", gid, "work_id", workID, "error", appErr)
	}
}

func adoptAndPublish(c fiber.Ctx, v2 *catalogv2.Client, token string, workID int64) error {
	if v2 == nil || !v2.Configured() {
		return catalogv2.ErrNotConfigured
	}
	_, claimErr := v2.CreateClaim(c.Context(), token, workID, workID)
	if _, pubErr := v2.PatchClaim(c.Context(), token, workID, catalogv2.ClaimStateLive); pubErr != nil {
		if claimErr != nil {
			return claimErr
		}
		return pubErr
	}
	return nil
}

func (h *PatchHandler) patchClaim(c fiber.Ctx, token string, workID int64, state string) error {
	v2 := h.catalogV2()
	if v2 == nil || !v2.Configured() {
		return catalogv2.ErrNotConfigured
	}
	_, err := v2.PatchClaim(c.Context(), token, workID, state)
	return err
}
