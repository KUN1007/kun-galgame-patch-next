package handler

import (
	"encoding/json"
	"io"
	"regexp"
	"strconv"

	"kun-galgame-patch-api/internal/middleware"
	"kun-galgame-patch-api/internal/patch/dto"
	"kun-galgame-patch-api/internal/patch/model"
	"kun-galgame-patch-api/internal/patch/service"
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/response"
	"kun-galgame-patch-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/go-playground/validator/v10"
)

// 用于非创作者的 VNDB ID 校验（对齐 apps/next-web/validations）
var vndbIDRegex = regexp.MustCompile(`^v\d+$`)

var patchCreateValidator = validator.New(validator.WithRequiredStructEnabled())

type PatchHandler struct {
	service *service.PatchService
}

func New(svc *service.PatchService) *PatchHandler {
	return &PatchHandler{service: svc}
}

func getIDParam(c *fiber.Ctx, name string) (int, error) {
	id, err := strconv.Atoi(c.Params(name))
	if err != nil || id < 1 {
		return 0, errors.ErrBadRequest("invalid ID")
	}
	return id, nil
}

// ===== Patch CRUD =====

// CreatePatch POST /api/patch
//
// 请求体：multipart/form-data
//   - banner：图片文件（server 侧 resize 到 1920x1080 内 + JPEG quality=85）
//   - data：JSON 字符串，对应 dto.PatchCreateRequest
//
// 非创作者（role < 2）必须提供合法 vndb_id；启用 creator-only 时禁止非创作者创建。
func (h *PatchHandler) CreatePatch(c *fiber.Ctx) error {
	user := middleware.MustGetUser(c)

	// creator-only 全局开关
	if h.service.IsCreatorOnlyEnabled() && user.Role < 2 {
		return response.Error(c, errors.ErrForbidden())
	}

	// ── 解 multipart：data JSON + banner 文件 ──
	bannerFile, err := c.FormFile("banner")
	if err != nil || bannerFile == nil {
		return response.Error(c, errors.ErrBadRequest("缺少 banner 文件"))
	}
	if bannerFile.Size > 10*1024*1024 {
		return response.Error(c, errors.ErrBadRequest("banner 图片超过 10MB"))
	}

	dataStr := c.FormValue("data")
	if dataStr == "" {
		return response.Error(c, errors.ErrBadRequest("缺少 data 字段"))
	}
	var req dto.PatchCreateRequest
	if err := json.Unmarshal([]byte(dataStr), &req); err != nil {
		return response.Error(c, errors.ErrBadRequest("data 字段不是合法 JSON"))
	}
	if err := patchCreateValidator.Struct(&req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	// 非创作者必须有合法 VNDB ID
	if user.Role < 2 && !vndbIDRegex.MatchString(req.VndbID) {
		return response.Error(c, errors.ErrBadRequest("为防止恶意发布，仅限创作者可不填写 VNDB ID"))
	}

	// 别名清洗
	aliases := make([]string, 0, len(req.Alias))
	for _, a := range req.Alias {
		if a == "" {
			continue
		}
		aliases = append(aliases, a)
	}

	// 读 banner 字节
	fh, err := bannerFile.Open()
	if err != nil {
		return response.Error(c, errors.ErrBadRequest("读取 banner 失败"))
	}
	defer fh.Close()
	bannerBytes, err := io.ReadAll(fh)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest("读取 banner 失败"))
	}

	id, err := h.service.CreatePatch(c.Context(), user.UID, service.CreatePatchInput{
		VndbID:           req.VndbID,
		NameZhCn:         req.NameZhCn,
		NameJaJp:         req.NameJaJp,
		NameEnUs:         req.NameEnUs,
		IntroductionZhCn: req.IntroductionZhCn,
		IntroductionJaJp: req.IntroductionJaJp,
		IntroductionEnUs: req.IntroductionEnUs,
		Alias:            aliases,
		Released:         req.Released,
		ContentLimit:     req.ContentLimit,
	}, bannerBytes)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OK(c, map[string]int{"id": id})
}

// UpdateBanner POST /api/patch/:id/banner
// 请求体 multipart/form-data：banner 图片文件。
func (h *PatchHandler) UpdateBanner(c *fiber.Ctx) error {
	patchID, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}
	user := middleware.MustGetUser(c)

	bannerFile, err := c.FormFile("banner")
	if err != nil || bannerFile == nil {
		return response.Error(c, errors.ErrBadRequest("缺少 banner 文件"))
	}
	if bannerFile.Size > 10*1024*1024 {
		return response.Error(c, errors.ErrBadRequest("banner 图片超过 10MB"))
	}

	fh, err := bannerFile.Open()
	if err != nil {
		return response.Error(c, errors.ErrBadRequest("读取 banner 失败"))
	}
	defer fh.Close()
	bannerBytes, err := io.ReadAll(fh)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest("读取 banner 失败"))
	}

	bannerURL, err := h.service.UpdateBanner(c.Context(), patchID, user.UID, user.Role, bannerBytes)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	return response.OK(c, map[string]string{"banner": bannerURL})
}

// GetPatch GET /api/patch/:id
func (h *PatchHandler) GetPatch(c *fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	patch, err := h.service.GetPatch(id)
	if err != nil {
		return response.Error(c, errors.ErrNotFound("patch not found"))
	}

	// Check if favorited by current user
	result := map[string]any{
		"patch":       patch,
		"is_favorite": false,
	}
	if user := middleware.GetUser(c); user != nil {
		result["is_favorite"] = h.service.IsFavorited(user.UID, id)
	}

	return response.OK(c, result)
}

// GetPatchDetail GET /api/patch/:id/detail
func (h *PatchHandler) GetPatchDetail(c *fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	patch, err := h.service.GetPatchDetail(id)
	if err != nil {
		return response.Error(c, errors.ErrNotFound("patch not found"))
	}

	return response.OK(c, patch)
}

// UpdatePatch PUT /api/patch/:id
func (h *PatchHandler) UpdatePatch(c *fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.PatchUpdateRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	user := middleware.MustGetUser(c)
	patch := &model.Patch{
		NameZhCn:         req.NameZhCn,
		NameJaJp:         req.NameJaJp,
		NameEnUs:         req.NameEnUs,
		IntroductionZhCn: req.IntroductionZhCn,
		IntroductionJaJp: req.IntroductionJaJp,
		IntroductionEnUs: req.IntroductionEnUs,
		Released:         req.Released,
		ContentLimit:     req.ContentLimit,
	}
	if req.VndbID != "" {
		patch.VndbID = &req.VndbID
	}

	if err := h.service.UpdatePatch(id, user.UID, user.Role, patch, req.Alias); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OKMessage(c, "Patch updated")
}

// DeletePatch DELETE /api/patch/:id
func (h *PatchHandler) DeletePatch(c *fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	user := middleware.MustGetUser(c)
	if err := h.service.DeletePatch(id, user.UID, user.Role); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OKMessage(c, "Patch deleted")
}

// CheckDuplicate GET /api/patch/duplicate
func (h *PatchHandler) CheckDuplicate(c *fiber.Ctx) error {
	var req dto.DuplicateCheckRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	exists, err := h.service.CheckDuplicate(req.VndbID)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}

	return response.OK(c, map[string]bool{"exists": exists})
}

// IncrementView PUT /api/patch/:id/view
func (h *PatchHandler) IncrementView(c *fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}
	h.service.IncrementView(id)
	return response.OKMessage(c, "OK")
}

// ===== Comments =====

// GetComments GET /api/patch/:id/comment
func (h *PatchHandler) GetComments(c *fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.GetPatchCommentRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	comments, total, err := h.service.GetComments(id, req.Page, req.Limit)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}

	return response.Paginated(c, comments, total)
}

// CreateComment POST /api/patch/:id/comment
func (h *PatchHandler) CreateComment(c *fiber.Ctx) error {
	patchID, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.PatchCommentCreateRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	req.PatchID = patchID

	user := middleware.MustGetUser(c)
	comment, err := h.service.CreateComment(patchID, user.UID, req.Content, req.ParentID)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	// Background notifications
	go func() {
		h.service.CreateMentionMessages(user.UID, patchID, req.Content)
		h.service.CreateCommentNotification(user.UID, comment)
	}()

	return response.OK(c, comment)
}

// UpdateComment PUT /api/patch/comment/:commentId
func (h *PatchHandler) UpdateComment(c *fiber.Ctx) error {
	commentID, err := getIDParam(c, "commentId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.PatchCommentUpdateRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	user := middleware.MustGetUser(c)
	if err := h.service.UpdateComment(commentID, user.UID, req.Content); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OKMessage(c, "Comment updated")
}

// DeleteComment DELETE /api/patch/comment/:commentId
func (h *PatchHandler) DeleteComment(c *fiber.Ctx) error {
	commentID, err := getIDParam(c, "commentId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	user := middleware.MustGetUser(c)
	if err := h.service.DeleteComment(commentID, user.UID, user.Role); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OKMessage(c, "Comment deleted")
}

// ToggleCommentLike PUT /api/patch/comment/:commentId/like
func (h *PatchHandler) ToggleCommentLike(c *fiber.Ctx) error {
	commentID, err := getIDParam(c, "commentId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	user := middleware.MustGetUser(c)
	liked, err := h.service.ToggleCommentLike(commentID, user.UID)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OK(c, map[string]bool{"liked": liked})
}

// GetCommentMarkdown GET /api/patch/comment/:commentId/markdown
func (h *PatchHandler) GetCommentMarkdown(c *fiber.Ctx) error {
	commentID, err := getIDParam(c, "commentId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	md, err := h.service.GetCommentMarkdown(commentID)
	if err != nil {
		return response.Error(c, errors.ErrNotFound("comment not found"))
	}

	return response.OK(c, map[string]string{"markdown": md})
}

// ===== Resources =====

// GetResources GET /api/patch/:id/resource
func (h *PatchHandler) GetResources(c *fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	resources, err := h.service.GetResources(id)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}

	return response.OK(c, resources)
}

// CreateResource POST /api/patch/:id/resource
func (h *PatchHandler) CreateResource(c *fiber.Ctx) error {
	patchID, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.PatchResourceCreateRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	user := middleware.MustGetUser(c)
	resource := &model.PatchResource{
		PatchID:   patchID,
		Storage:   req.Storage,
		Name:      req.Name,
		ModelName: req.ModelName,
		S3Key:     req.S3Key,
		Content:   req.Content,
		Size:      req.Size,
		Code:      req.Code,
		Password:  req.Password,
		Note:      req.Note,
		Type:      model.JSONArray(req.Type),
		Language:  model.JSONArray(req.Language),
		Platform:  model.JSONArray(req.Platform),
	}

	if err := h.service.CreateResource(resource, user.UID); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OK(c, resource)
}

// UpdateResource PUT /api/patch/resource/:resourceId
func (h *PatchHandler) UpdateResource(c *fiber.Ctx) error {
	resourceID, err := getIDParam(c, "resourceId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.PatchResourceCreateRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	user := middleware.MustGetUser(c)
	update := &model.PatchResource{
		Storage:   req.Storage,
		Name:      req.Name,
		ModelName: req.ModelName,
		S3Key:     req.S3Key,
		Content:   req.Content,
		Size:      req.Size,
		Code:      req.Code,
		Password:  req.Password,
		Note:      req.Note,
		Type:      model.JSONArray(req.Type),
		Language:  model.JSONArray(req.Language),
		Platform:  model.JSONArray(req.Platform),
	}

	if err := h.service.UpdateResource(resourceID, user.UID, update); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OKMessage(c, "Resource updated")
}

// DeleteResource DELETE /api/patch/resource/:resourceId
func (h *PatchHandler) DeleteResource(c *fiber.Ctx) error {
	resourceID, err := getIDParam(c, "resourceId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	user := middleware.MustGetUser(c)
	if err := h.service.DeleteResource(resourceID, user.UID); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OKMessage(c, "Resource deleted")
}

// ToggleResourceDisable PUT /api/patch/resource/:resourceId/disable
func (h *PatchHandler) ToggleResourceDisable(c *fiber.Ctx) error {
	resourceID, err := getIDParam(c, "resourceId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	user := middleware.MustGetUser(c)
	if err := h.service.ToggleResourceDisable(resourceID, user.UID, user.Role); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OKMessage(c, "OK")
}

// IncrementResourceDownload PUT /api/patch/resource/:resourceId/download
func (h *PatchHandler) IncrementResourceDownload(c *fiber.Ctx) error {
	resourceID, err := getIDParam(c, "resourceId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	if err := h.service.IncrementResourceDownload(resourceID); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OKMessage(c, "OK")
}

// ToggleResourceLike PUT /api/patch/resource/:resourceId/like
func (h *PatchHandler) ToggleResourceLike(c *fiber.Ctx) error {
	resourceID, err := getIDParam(c, "resourceId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	user := middleware.MustGetUser(c)
	liked, err := h.service.ToggleResourceLike(resourceID, user.UID)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OK(c, map[string]bool{"liked": liked})
}

// ===== Favorites =====

// ToggleFavorite PUT /api/patch/:id/favorite
func (h *PatchHandler) ToggleFavorite(c *fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	user := middleware.MustGetUser(c)
	favorited, err := h.service.ToggleFavorite(id, user.UID)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OK(c, map[string]bool{"favorited": favorited})
}

// ===== Contributors =====

// GetContributors GET /api/patch/:id/contributor
func (h *PatchHandler) GetContributors(c *fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	contributors, err := h.service.GetContributors(id)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}

	return response.OK(c, contributors)
}

// GetRandomPatch GET /api/home/random
func (h *PatchHandler) GetRandomPatch(c *fiber.Ctx) error {
	id, err := h.service.GetRandomPatchID()
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.OK(c, map[string]int{"id": id})
}
