package handler

import (
	"regexp"
	"strconv"

	galgameClient "kun-galgame-patch-api/internal/galgame/client"
	"kun-galgame-patch-api/internal/galgame/enricher"
	"kun-galgame-patch-api/internal/middleware"
	"kun-galgame-patch-api/internal/patch/dto"
	"kun-galgame-patch-api/internal/patch/model"
	"kun-galgame-patch-api/internal/patch/service"
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/response"
	"kun-galgame-patch-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
)

// 非创作者需要 vndb_id；所有情况下我们都要求 vndb_id 格式合法。
var vndbIDRegex = regexp.MustCompile(`^v\d+$`)

type PatchHandler struct {
	service *service.PatchService
	wiki    *galgameClient.Client
}

func New(svc *service.PatchService, wiki *galgameClient.Client) *PatchHandler {
	return &PatchHandler{service: svc, wiki: wiki}
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
// D12（2026-04-21）：请求体简化为 JSON：{ "vndb_id": "vXXX" }。
// 服务端会调 Wiki /galgame/check 验证并拿到 galgame_id 回填到本地。
// 启用 creator-only 时禁止非创作者创建；非创作者必须提供合法 vndb_id（现在本来就必填）。
func (h *PatchHandler) CreatePatch(c *fiber.Ctx) error {
	user := middleware.MustGetUser(c)

	if h.service.IsCreatorOnlyEnabled() && user.Role < 2 {
		return response.Error(c, errors.ErrForbidden())
	}

	var req dto.PatchCreateRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	if !vndbIDRegex.MatchString(req.VndbID) {
		return response.Error(c, errors.ErrBadRequest("vndb_id 格式不合法（应为 vXXX）"))
	}

	id, err := h.service.CreatePatch(c.Context(), user.UID, req.VndbID)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	return response.OK(c, map[string]int{"id": id})
}

// headerCard 把 GalgameCard + is_favorite 扁平化，贴合前端 PatchHeader 形状。
type headerCard struct {
	enricher.GalgameCard
	IsFavorite bool `json:"isFavorite"`
}

// GetPatch GET /api/patch/:id
//
// D12：直接返回 GalgameCard 扁平结构（不再套 patch / is_favorite 两层）。
// 前端 PatchHeader = GalgameCard + isFavorite。
func (h *PatchHandler) GetPatch(c *fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	patch, err := h.service.GetPatch(id)
	if err != nil {
		return response.Error(c, errors.ErrNotFound("patch not found"))
	}

	card := headerCard{GalgameCard: enricher.EnrichPatch(c.Context(), h.wiki, patch)}
	if user := middleware.GetUser(c); user != nil {
		card.IsFavorite = h.service.IsFavorited(user.UID, id)
	}
	return response.OK(c, card)
}

// GetPatchDetail GET /api/patch/:id/detail
//
// D12：详情富化走 Wiki /galgame/:gid，多拿 intro / tag_ids / official_ids。
func (h *PatchHandler) GetPatchDetail(c *fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	patch, err := h.service.GetPatchDetail(id)
	if err != nil {
		return response.Error(c, errors.ErrNotFound("patch not found"))
	}
	return response.OK(c, enricher.EnrichPatchDetail(c.Context(), h.wiki, patch))
}

// UpdatePatch PUT /api/patch/:id
//
// D12 之后只允许"重新绑定 vndb_id"（仅创建者或 role >= 3 可操作）。
// 游戏名/介绍/封面等全走 Wiki，本端点不再接受它们。
func (h *PatchHandler) UpdatePatch(c *fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.PatchUpdateRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	if !vndbIDRegex.MatchString(req.VndbID) {
		return response.Error(c, errors.ErrBadRequest("vndb_id 格式不合法"))
	}

	user := middleware.MustGetUser(c)
	if err := h.service.UpdatePatch(c.Context(), id, user.UID, user.Role, req.VndbID); err != nil {
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
