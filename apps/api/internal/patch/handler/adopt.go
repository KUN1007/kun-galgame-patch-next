package handler

import (
	stderrors "errors"
	"log/slog"
	"net/http"

	"kun-galgame-patch-api/internal/middleware"
	"kun-galgame-patch-api/pkg/catalogclient"
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
	if appErr := adoptAndPublish(c, h.catalogV2(), h.catalog, token, workID); appErr != nil {
		slog.Warn("resource: 静默收录 catalog 作品失败", "gid", gid, "work_id", workID, "error", appErr)
	}
}

func adoptAndPublish(c fiber.Ctx, v2 *catalogv2.Client, v1 *catalogclient.Client, token string, workID int64) error {
	if v2 != nil && v2.Configured() {
		_, claimErr := v2.CreateClaim(c.Context(), token, workID, workID)
		_, pubErr := v2.PatchClaim(c.Context(), token, workID, "live")
		if pubErr == nil {
			return nil
		}
		if !catalogWriteFallback(pubErr) {
			if claimErr != nil {
				return claimErr
			}
			return pubErr
		}
	}
	if v1 == nil || !v1.Configured() {
		return catalogv2.ErrNotConfigured
	}
	_, claimErr := v1.ActOnClaimUser(c.Context(), token, workID,
		catalogclient.ClaimActionClaim,
		catalogclient.UserClaimActionRequest{ProductWorkID: workID})
	_, pubErr := v1.ActOnClaimUser(c.Context(), token, workID,
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

func catalogWriteFallback(err error) bool {
	if stderrors.Is(err, catalogv2.ErrNotFound) {
		return true
	}
	var p *catalogv2.Problem
	if !stderrors.As(err, &p) {
		return false
	}
	return p.Status == http.StatusNotFound || p.Status == http.StatusMethodNotAllowed ||
		p.Status == http.StatusUnprocessableEntity
}

func (h *PatchHandler) patchClaim(c fiber.Ctx, token string, workID int64, state, v1Action string) error {
	v2 := h.catalogV2()
	if v2 != nil && v2.Configured() {
		_, err := v2.PatchClaim(c.Context(), token, workID, state)
		if err == nil || !catalogWriteFallback(err) {
			return err
		}
	}
	if h.catalog == nil || !h.catalog.Configured() {
		return catalogv2.ErrNotConfigured
	}
	_, err := h.catalog.ActOnClaimUser(c.Context(), token, workID, v1Action, catalogclient.UserClaimActionRequest{})
	return err
}
