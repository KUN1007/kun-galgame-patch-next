package upload

import (
	stderrors "errors"
	"io"

	"kun-galgame-patch-api/internal/constants"
	"kun-galgame-patch-api/internal/middleware"
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/imageclient"
	"kun-galgame-patch-api/pkg/response"
	"kun-galgame-patch-api/pkg/utils"

	"github.com/gofiber/fiber/v3"
)

// Handler exposes 5 HTTP endpoints + the image_service upload proxy.
type Handler struct {
	svc *Service
	// img uploads moyu's OWN content images (preset=topic) under site=moyu.
	img *imageclient.Client // image_service SDK (W2 / PR3b)
}

// NewHandler constructs a Handler. img may be nil in tests.
func NewHandler(svc *Service, img *imageclient.Client) *Handler {
	return &Handler{svc: svc, img: img}
}

// uploadTier resolves the caller's per-role upload allowance from the OAuth
// roles claim: admin/ren > moderator > creator > user. Each tier is distinct;
// a user holding several roles gets the highest (admin checked first).
func uploadTier(c fiber.Ctx) constants.UploadTier {
	switch {
	case middleware.IsAdmin(c):
		return constants.AdminUploadTier
	case middleware.HasRole(c, "moderator"):
		return constants.ModeratorUploadTier
	case middleware.HasRole(c, "creator"):
		return constants.CreatorUploadTier
	default:
		return constants.UserUploadTier
	}
}

// Init POST /api/upload/init — start an upload; the artifact service decides
// single-PUT vs multipart and returns the presigned URL(s).
func (h *Handler) Init(c fiber.Ctx) error {
	var req InitRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	user := middleware.MustGetUser(c)

	resp, err := h.svc.Init(c.Context(), user.ID, uploadTier(c), req)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	return response.OK(c, resp)
}

// Complete POST /api/upload/complete — finalize (size verified by artifact) and
// deduct the per-user daily quota.
func (h *Handler) Complete(c fiber.Ctx) error {
	var req CompleteRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	user := middleware.MustGetUser(c)

	resp, err := h.svc.Complete(c.Context(), user.ID, uploadTier(c), req)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	return response.OK(c, resp)
}

// Resume POST /api/upload/resume — continue an interrupted upload. The artifact
// service lists the parts already in B2 and re-presigns only the missing ones, so
// a paused / dropped / page-refreshed upload finishes without re-sending bytes.
func (h *Handler) Resume(c fiber.Ctx) error {
	var req ResumeRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	_ = middleware.MustGetUser(c)

	resp, err := h.svc.Resume(c.Context(), req)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	return response.OK(c, resp)
}

// UploadImageService POST /api/upload/image-service
//
// Proxies a multipart image upload to the centralized image_service
// (kun-galgame-infra :9278) and returns the content hash + variant URLs. Every
// byte it stores is moyu's own (site=moyu): the editor-inline and admin-doc
// images.
//
// Body: multipart/form-data with required `file` (image binary) and `preset`
// form field. moyu forwards the preset VERBATIM — image_service owns the
// allowlist (`image_allowed_presets` per OAuth client) and rejects anything not
// enabled, so there is intentionally no preset allowlist here. moyu's only
// caller sends `topic` (editor-inline / admin doc images); avatars use OAuth's
// /auth/me/avatar and never reach this endpoint.
//
// Wave 161 (N5) removed the second lane. `galgame_banner` / `galgame_screenshot`
// used to be proxied to the wiki's POST /galgame/image so the bytes were owned
// by site=galgame_wiki rather than site=moyu, but a census found ZERO senders on
// the moyu frontend — the wiki editing surface it existed for became an external
// navigate to kungal several waves ago. The lane went with the wiki write face
// it called; the site=galgame_wiki image key it used is untouched here and stays
// the wiki's own.
//
// 10MB body cap is inherited from the Fiber app config; image_service itself
// enforces per-preset size + per-client daily quota.
func (h *Handler) UploadImageService(c fiber.Ctx) error {
	user := middleware.MustGetUser(c)

	preset := c.FormValue("preset")
	if preset == "" {
		return response.Error(c, errors.ErrBadRequest("缺少 preset 字段"))
	}

	fh, ferr := c.FormFile("file")
	if ferr != nil {
		return response.Error(c, errors.ErrBadRequest("缺少 file 字段"))
	}
	if fh.Size > 10*1024*1024 {
		return response.Error(c, errors.ErrBadRequest("文件超过 10MB 上限"))
	}
	f, oerr := fh.Open()
	if oerr != nil {
		return response.Error(c, errors.ErrBadRequest("无法读取上传文件"))
	}
	defer f.Close()
	mime := fh.Header.Get("Content-Type")

	if h.img == nil {
		return response.Error(c, errors.ErrInternal("image_service 客户端未配置"))
	}

	// Per-USER daily cap: image_service enforces only a per-SITE quota, so moyu
	// applies its own per-user fair-use limit here (aligned with kungal).
	if qErr := h.svc.CheckDailyImageQuota(user.ID); qErr != nil {
		if stderrors.Is(qErr, errDailyImageLimit) {
			return response.Error(c, errors.New(80008, qErr.Error(), fiber.StatusTooManyRequests))
		}
		// A DB-read failure must not masquerade as a 429 rate-limit.
		return response.Error(c, errors.ErrInternal("查询上传配额失败"))
	}

	result, err := h.img.Upload(c.Context(), io.Reader(f), fh.Filename, mime, preset)
	if err != nil {
		switch {
		case stderrors.Is(err, imageclient.ErrQuotaExceeded):
			return response.Error(c, errors.New(80008, err.Error(), fiber.StatusTooManyRequests))
		case stderrors.Is(err, imageclient.ErrModerationRejected):
			return response.Error(c, errors.New(60002, err.Error(), fiber.StatusUnprocessableEntity))
		case stderrors.Is(err, imageclient.ErrUnauthorized):
			return response.Error(c, errors.ErrInternal("image_service 鉴权失败（检查 client_id/secret 与 image_enabled）"))
		default:
			return response.Error(c, errors.ErrInternal("image_service 上传失败: "+err.Error()))
		}
	}

	h.svc.IncrementDailyImageCount(user.ID)
	return response.OK(c, result)
}

// Abort POST /api/upload/abort — voluntarily cancel an in-progress upload.
func (h *Handler) Abort(c fiber.Ctx) error {
	var req AbortRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	_ = middleware.MustGetUser(c)

	if err := h.svc.Abort(c.Context(), req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	return response.OKMessage(c, "已放弃上传")
}
