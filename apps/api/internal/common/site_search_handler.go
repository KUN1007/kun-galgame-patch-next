package common

import (
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/response"
	"kun-galgame-patch-api/pkg/utils"

	"github.com/gofiber/fiber/v3"
)

type siteSearchRequest struct {
	Keywords string `query:"keywords" validate:"required,max=107"`
	Type     string `query:"type" validate:"required,oneof=galgame resource user"`
	Page     int    `query:"page" validate:"required,min=1"`
	Limit    int    `query:"limit" validate:"required,min=1,max=24"`
}

type siteSearchKeywordsRequest struct {
	Keywords string `query:"keywords" validate:"required,max=107"`
}

// An empty family is 全部: every family at once, which is what the 资料库 tab
// opens on. Page and limit only mean anything once one family is named.
type siteSearchEntityRequest struct {
	Keywords string `query:"keywords" validate:"required,max=107"`
	Family   string `query:"family" validate:"omitempty,oneof=character company staff tag series"`
	Page     int    `query:"page" validate:"required,min=1"`
	Limit    int    `query:"limit" validate:"required,min=1,max=24"`
}

// SiteSearch answers one category, paged. The overview below answers all of
// them at once and is what the category rail counts with, so a deep link
// straight into 用户 still knows how many games the keyword matched.
func (h *CommonHandler) SiteSearch(c fiber.Ctx) error {
	var req siteSearchRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	if len(searchKeywords(req.Keywords)) == 0 {
		return response.Error(c, errors.ErrBadRequest("搜索关键词不能为空"))
	}

	switch req.Type {
	case "galgame":
		items, total, appErr := h.searchGalgameLane(c.Context(), req.Keywords, req.Page, req.Limit)
		if appErr != nil {
			return response.Error(c, appErr)
		}
		return response.Paginated(c, items, total)
	case "resource":
		items, total, appErr := h.searchResourceLane(
			c.Context(), req.Keywords, req.Page, req.Limit, utils.ContentLimitForListBrowse(c))
		if appErr != nil {
			return response.Error(c, appErr)
		}
		return response.Paginated(c, items, total)
	default:
		items, total, appErr := h.searchUserLane(c.Context(), req.Keywords, req.Page, req.Limit)
		if appErr != nil {
			return response.Error(c, appErr)
		}
		return response.Paginated(c, items, total)
	}
}

func (h *CommonHandler) SiteSearchOverview(c fiber.Ctx) error {
	var req siteSearchKeywordsRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	if len(searchKeywords(req.Keywords)) == 0 {
		return response.Error(c, errors.ErrBadRequest("搜索关键词不能为空"))
	}

	return response.OK(c, h.runSearchLanes(
		c.Context(), req.Keywords, utils.ContentLimitForListBrowse(c),
		searchLaneLimits{
			galgame:  searchOverviewGalgameLimit,
			entity:   searchOverviewEntityLimit,
			resource: searchOverviewResourceLimit,
			user:     searchOverviewUserLimit,
		},
	))
}

// SiteSearchEntity is its own endpoint rather than a type of SiteSearch: the
// 资料库 tab pages one family at a time and 全部 pages none of them, so neither
// the response shape nor the paginator matches the other three lanes.
func (h *CommonHandler) SiteSearchEntity(c fiber.Ctx) error {
	var req siteSearchEntityRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	if len(searchKeywords(req.Keywords)) == 0 {
		return response.Error(c, errors.ErrBadRequest("搜索关键词不能为空"))
	}

	groups, appErr := h.searchEntityLane(
		c.Context(), req.Keywords, req.Family, req.Page, req.Limit,
		utils.ContentLimitForListBrowse(c))
	if appErr != nil {
		return response.Error(c, appErr)
	}
	return response.OK(c, fiber.Map{"groups": groups})
}

func (h *CommonHandler) SiteSearchQuick(c fiber.Ctx) error {
	var req siteSearchKeywordsRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	if len(searchKeywords(req.Keywords)) == 0 {
		return response.Error(c, errors.ErrBadRequest("搜索关键词不能为空"))
	}

	return response.OK(c, h.runSearchLanes(
		c.Context(), req.Keywords, utils.ContentLimitForListBrowse(c),
		searchLaneLimits{
			galgame:  searchQuickLimit,
			resource: searchQuickLimit,
			user:     searchQuickLimit,
		},
	))
}
