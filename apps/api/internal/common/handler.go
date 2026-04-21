package common

import (
	"encoding/json"
	"fmt"

	patchModel "kun-galgame-patch-api/internal/patch/model"
	"kun-galgame-patch-api/internal/middleware"
	userModel "kun-galgame-patch-api/internal/user/model"
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/response"
	"kun-galgame-patch-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type CommonHandler struct {
	db *gorm.DB
}

func NewHandler(db *gorm.DB) *CommonHandler {
	return &CommonHandler{db: db}
}

// getNSFWFilter extracts the NSFW filter from the request header
func getNSFWFilter(c *fiber.Ctx) string {
	nsfw := c.Get("x-nsfw-header", "{}")
	var opt struct {
		ShowNSFW bool `json:"showNSFW"`
	}
	json.Unmarshal([]byte(nsfw), &opt)
	if !opt.ShowNSFW {
		return "sfw"
	}
	return ""
}

// ===== Home =====

type homeResponse struct {
	GalgameCards []patchModel.Patch         `json:"galgame_cards"`
	Resources    []patchModel.PatchResource `json:"resources"`
	Comments     []patchModel.PatchComment  `json:"comments"`
}

// GetHome GET /api/home
func (h *CommonHandler) GetHome(c *fiber.Ctx) error {
	filter := getNSFWFilter(c)

	var patches []patchModel.Patch
	var resources []patchModel.PatchResource
	var comments []patchModel.PatchComment

	patchQ := h.db.Model(&patchModel.Patch{})
	resQ := h.db.Model(&patchModel.PatchResource{})
	commentQ := h.db.Model(&patchModel.PatchComment{})

	if filter != "" {
		patchQ = patchQ.Where("content_limit = ?", filter)
	}

	patchQ.Order("created DESC").Limit(12).
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name", "avatar")
		}).
		Preload("Tags.Tag").
		Find(&patches)

	resQ.Order("created DESC").Limit(6).
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name", "avatar")
		}).Find(&resources)

	commentQ.Order("created DESC").Limit(6).
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name", "avatar")
		}).Find(&comments)

	return response.OK(c, homeResponse{
		GalgameCards: patches,
		Resources:    resources,
		Comments:     comments,
	})
}

// ===== Galgame List =====

type galgameListRequest struct {
	SelectedType string `query:"selectedType" validate:"required,min=1,max=107"`
	SortField    string `query:"sortField" validate:"required,oneof=resource_update_time created view download"`
	SortOrder    string `query:"sortOrder" validate:"required,oneof=asc desc"`
	Page         int    `query:"page" validate:"required,min=1"`
	Limit        int    `query:"limit" validate:"required,min=1,max=24"`
	YearString   string `query:"yearString" validate:"max=1007"`
	MonthString  string `query:"monthString" validate:"max=1007"`
}

// GetGalgameList GET /api/galgame
func (h *CommonHandler) GetGalgameList(c *fiber.Ctx) error {
	var req galgameListRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	filter := getNSFWFilter(c)
	query := h.db.Model(&patchModel.Patch{})

	if filter != "" {
		query = query.Where("content_limit = ?", filter)
	}
	if req.SelectedType != "all" {
		query = query.Where("type @> ?", fmt.Sprintf(`["%s"]`, req.SelectedType))
	}
	if req.YearString != "" && req.YearString != "0" {
		query = query.Where("released LIKE ?", req.YearString+"%")
		if req.MonthString != "" && req.MonthString != "0" {
			query = query.Where("released LIKE ?", req.YearString+"-"+req.MonthString+"%")
		}
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
	return response.Paginated(c, patches, total)
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
func (h *CommonHandler) GetGlobalResources(c *fiber.Ctx) error {
	var req resourceListRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	filter := getNSFWFilter(c)
	var resources []patchModel.PatchResource
	var total int64

	query := h.db.Model(&patchModel.PatchResource{})
	if filter != "" {
		query = query.Joins("JOIN patch ON patch.id = patch_resource.patch_id").
			Where("patch.content_limit = ?", filter)
	}
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
