package handler

import (
	"log/slog"

	"kun-galgame-patch-api/internal/middleware"
	"kun-galgame-patch-api/pkg/catalogclient"

	"github.com/gofiber/fiber/v3"
)

func (h *PatchHandler) claimOnFirstResource(c fiber.Ctx, gid int) {
	if h.catalog == nil || !h.catalog.Configured() {
		return
	}
	token := middleware.GetAccessToken(c)
	if token == "" {
		return
	}
	workID, found, err := h.galgame.ResolveWorkID(c.Context(), gid)
	if err != nil || !found {
		slog.Warn("resource: 解析 catalog work 失败，跳过静默收录", "gid", gid, "error", err)
		return
	}
	if appErr := adoptAndPublish(c, h.catalog, token, workID); appErr != nil {
		slog.Warn("resource: 静默收录 catalog 作品失败", "gid", gid, "work_id", workID, "error", appErr)
	}
}

func adoptAndPublish(c fiber.Ctx, catalog *catalogclient.Client, token string, workID int64) error {
	_, claimErr := catalog.ActOnClaimUser(c.Context(), token, workID,
		catalogclient.ClaimActionClaim,
		catalogclient.UserClaimActionRequest{ProductWorkID: workID})
	_, pubErr := catalog.ActOnClaimUser(c.Context(), token, workID,
		catalogclient.ClaimActionPublish,
		catalogclient.UserClaimActionRequest{})
	if pubErr == nil {
		return nil
	}
	if claimErr != nil {
		return claimErr
	}
	return pubErr
}
