package common

import (
	"fmt"

	galgameClient "kun-galgame-patch-api/internal/galgame/client"
	"kun-galgame-patch-api/internal/galgame/enricher"
	"kun-galgame-patch-api/internal/middleware"
	patchModel "kun-galgame-patch-api/internal/patch/model"
	userModel "kun-galgame-patch-api/internal/user/model"
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/response"
	"kun-galgame-patch-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type CommonHandler struct {
	db   *gorm.DB
	wiki *galgameClient.Client
}

func NewHandler(db *gorm.DB, wiki *galgameClient.Client) *CommonHandler {
	return &CommonHandler{db: db, wiki: wiki}
}

// ===== Home =====

type homeResponse struct {
	Galgames  []enricher.GalgameCard     `json:"galgames"`
	Resources []patchModel.PatchResource `json:"resources"`
	Comments  []patchModel.PatchComment  `json:"comments"`
}

// GetHome GET /api/home
//
// D12：NSFW 过滤能力迁到 Wiki 侧（走 /api/search）。本端点只做"本站最近的补丁"展示，
// 富化后的 galgame 对象里有 content_limit 字段供前端客户端过滤。
func (h *CommonHandler) GetHome(c *fiber.Ctx) error {
	var patches []patchModel.Patch
	var resources []patchModel.PatchResource
	var comments []patchModel.PatchComment

	h.db.Model(&patchModel.Patch{}).Order("created DESC").Limit(12).
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name", "avatar")
		}).Find(&patches)

	h.db.Model(&patchModel.PatchResource{}).Order("created DESC").Limit(6).
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name", "avatar")
		}).Find(&resources)

	h.db.Model(&patchModel.PatchComment{}).Order("created DESC").Limit(6).
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name", "avatar")
		}).Find(&comments)

	return response.OK(c, homeResponse{
		Galgames:  enricher.EnrichPatches(c.Context(), h.wiki, patches),
		Resources: resources,
		Comments:  comments,
	})
}

// ===== Galgame List =====

type galgameListRequest struct {
	SelectedType string `query:"selectedType" validate:"required,min=1,max=107"`
	SortField    string `query:"sortField" validate:"required,oneof=resource_update_time created view download"`
	SortOrder    string `query:"sortOrder" validate:"required,oneof=asc desc"`
	Page         int    `query:"page" validate:"required,min=1"`
	Limit        int    `query:"limit" validate:"required,min=1,max=24"`
}

// GetGalgameList GET /api/galgame
//
// D12：按游戏发售年月/NSFW 过滤已迁到 Wiki（走 /api/search）。本端点只做 patch 自身
// 字段的筛选（翻译类型 type）和排序，然后用 Wiki 富化返回。
func (h *CommonHandler) GetGalgameList(c *fiber.Ctx) error {
	var req galgameListRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	query := h.db.Model(&patchModel.Patch{})
	if req.SelectedType != "all" {
		query = query.Where("type @> ?", fmt.Sprintf(`["%s"]`, req.SelectedType))
	}

	var total int64
	query.Count(&total)

	var patches []patchModel.Patch
	err := query.Order(fmt.Sprintf("%s %s", req.SortField, req.SortOrder)).
		Offset((req.Page - 1) * req.Limit).Limit(req.Limit).
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name", "avatar")
		}).Find(&patches).Error
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}

	return response.OK(c, map[string]any{
		"galgames": enricher.EnrichPatches(c.Context(), h.wiki, patches),
		"total":    total,
	})
}

// ===== Global Comments =====

type commentListRequest struct {
	SortField string `query:"sortField" validate:"required,oneof=created like_count"`
	SortOrder string `query:"sortOrder" validate:"required,oneof=asc desc"`
	Page      int    `query:"page" validate:"required,min=1"`
	Limit     int    `query:"limit" validate:"required,min=1,max=50"`
}

// GetGlobalComments GET /api/comment
func (h *CommonHandler) GetGlobalComments(c *fiber.Ctx) error {
	var req commentListRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	var comments []patchModel.PatchComment
	var total int64

	query := h.db.Model(&patchModel.PatchComment{})
	query.Count(&total)

	err := query.Order(fmt.Sprintf("%s %s", req.SortField, req.SortOrder)).
		Offset((req.Page - 1) * req.Limit).Limit(req.Limit).
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name", "avatar")
		}).Find(&comments).Error

	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.Paginated(c, comments, total)
}

// ===== Global Resources =====

type resourceListRequest struct {
	SortField string `query:"sortField" validate:"required,oneof=update_time created download like_count"`
	SortOrder string `query:"sortOrder" validate:"required,oneof=asc desc"`
	Page      int    `query:"page" validate:"required,min=1"`
	Limit     int    `query:"limit" validate:"required,min=1,max=50"`
}

// GetGlobalResources GET /api/resource
//
// D12：patch.content_limit 已删除，NSFW 过滤能力由 Wiki 侧提供。本端点不再做本地 NSFW 过滤。
func (h *CommonHandler) GetGlobalResources(c *fiber.Ctx) error {
	var req resourceListRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	var resources []patchModel.PatchResource
	var total int64

	query := h.db.Model(&patchModel.PatchResource{})
	query.Count(&total)

	sortField := req.SortField
	if sortField == "like" {
		sortField = "like_count"
	}

	err := query.Order(fmt.Sprintf("patch_resource.%s %s", sortField, req.SortOrder)).
		Offset((req.Page - 1) * req.Limit).Limit(req.Limit).
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name", "avatar")
		}).Find(&resources).Error

	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.Paginated(c, resources, total)
}

// GetResourceDetail GET /api/resource/:id
func (h *CommonHandler) GetResourceDetail(c *fiber.Ctx) error {
	resourceID := c.Params("id")
	var resource patchModel.PatchResource
	if dbErr := h.db.Preload("User", func(db *gorm.DB) *gorm.DB {
		return db.Select("id", "name", "avatar")
	}).First(&resource, resourceID).Error; dbErr != nil {
		return response.Error(c, errors.ErrNotFound("resource not found"))
	}

	// Get up to 5 recommendations from the same patch
	var recs []patchModel.PatchResource
	h.db.Where("patch_id = ? AND id != ?", resource.PatchID, resource.ID).
		Limit(5).Order("like_count DESC").Find(&recs)

	return response.OK(c, map[string]any{
		"resource":        resource,
		"recommendations": recs,
	})
}

// ===== Creator Application =====

// Apply POST /api/apply
func (h *CommonHandler) Apply(c *fiber.Ctx) error {
	user := middleware.MustGetUser(c)

	// Check minimum resource count
	var resourceCount int64
	h.db.Model(&patchModel.PatchResource{}).Where("user_id = ?", user.UID).Count(&resourceCount)
	if resourceCount < 3 {
		return response.Error(c, errors.ErrBadRequest("need at least 3 published resources"))
	}

	// Check for pending application
	var pendingCount int64
	h.db.Model(&userModel.UserMessage{}).
		Where("type = 'apply' AND sender_id = ? AND status = 0", user.UID).
		Count(&pendingCount)
	if pendingCount > 0 {
		return response.Error(c, errors.ErrBadRequest("you already have a pending application"))
	}

	msg := &userModel.UserMessage{
		Type:     "apply",
		Content:  fmt.Sprintf("Creator application from user %d", user.UID),
		Status:   0,
		SenderID: &user.UID,
	}
	h.db.Create(msg)
	return response.OKMessage(c, "Application submitted")
}

// GetApplyStatus GET /api/apply/status
func (h *CommonHandler) GetApplyStatus(c *fiber.Ctx) error {
	user := middleware.MustGetUser(c)

	var resourceCount int64
	h.db.Model(&patchModel.PatchResource{}).Where("user_id = ?", user.UID).Count(&resourceCount)

	return response.OK(c, map[string]any{
		"resource_count": resourceCount,
		"role":           user.Role,
	})
}

// ===== Hikari External API =====

// GetHikari GET /api/hikari
func (h *CommonHandler) GetHikari(c *fiber.Ctx) error {
	vndbID := c.Query("vndb_id")
	if vndbID == "" {
		return response.Error(c, errors.ErrBadRequest("vndb_id is required"))
	}

	var patch patchModel.Patch
	if err := h.db.Where("vndb_id = ?", vndbID).First(&patch).Error; err != nil {
		return response.Error(c, errors.ErrNotFound("patch not found"))
	}

	// Get resources but strip S3 download content
	var resources []patchModel.PatchResource
	h.db.Where("patch_id = ?", patch.ID).Find(&resources)

	for i := range resources {
		if resources[i].Storage == "s3" {
			resources[i].Content = ""
		}
	}

	return response.OK(c, map[string]any{
		"patch":     patch,
		"resources": resources,
	})
}

// GetMoyuHasPatch GET /api/moyu/patch/has-patch
func (h *CommonHandler) GetMoyuHasPatch(c *fiber.Ctx) error {
	var vndbIDs []string
	h.db.Model(&patchModel.Patch{}).
		Joins("JOIN patch_resource ON patch_resource.patch_id = patch.id").
		Where("patch.vndb_id IS NOT NULL").
		Distinct("patch.vndb_id").
		Pluck("patch.vndb_id", &vndbIDs)

	return response.OK(c, vndbIDs)
}
