// Package search 实现 POST /api/search：委托 Galgame Wiki 做全文搜索，
// 再用返回的 vndb_id 在本地查出有哪些补丁。
//
// 设计（D11，2026-04-21）：
//   - 搜索/召回全交给 Wiki（60k galgame + Meilisearch + CJK 分词）
//   - 本站只回答"这些 galgame 在本站有没有补丁"
//   - 本地不再索引，不再同步
package search

import (
	"encoding/json"
	"log/slog"

	galgameClient "kun-galgame-patch-api/internal/galgame/client"
	patchModel "kun-galgame-patch-api/internal/patch/model"
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/response"
	"kun-galgame-patch-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// Handler 处理 /api/search 请求。
type Handler struct {
	db   *gorm.DB
	wiki *galgameClient.Client
}

// New 构造 Handler。
func New(db *gorm.DB, wiki *galgameClient.Client) *Handler {
	return &Handler{db: db, wiki: wiki}
}

// SearchRequest 搜索请求体。
// 支持 Wiki 侧的大部分 filter 参数，直接透传。
type SearchRequest struct {
	Q            string `json:"q" validate:"max=200"`
	TagIDs       []int  `json:"tag_ids" validate:"omitempty,max=20,dive,min=1"`
	OfficialIDs  []int  `json:"official_ids" validate:"omitempty,max=20,dive,min=1"`
	EngineIDs    []int  `json:"engine_ids" validate:"omitempty,max=20,dive,min=1"`
	OriginalLang string `json:"original_language" validate:"max=100"`
	AgeLimit     string `json:"age_limit" validate:"omitempty,oneof=all r18"`
	ReleasedFrom int    `json:"released_from" validate:"omitempty,min=1970,max=2200"`
	ReleasedTo   int    `json:"released_to" validate:"omitempty,min=1970,max=2200"`
	IncludeIntro bool   `json:"include_intro"`
	Sort         string `json:"sort" validate:"omitempty,oneof=relevance released_desc released_asc view updated"`
	Page         int    `json:"page" validate:"required,min=1"`
	Limit        int    `json:"limit" validate:"required,min=1,max=50"`
}

// SearchHit 是返回给前端的单条结果：Wiki 的 galgame 信息 + 本站是否有补丁。
type SearchHit struct {
	galgameClient.GalgameHit
	HasPatch bool                   `json:"has_patch"`
	Patch    *patchModel.Patch      `json:"patch,omitempty"`
}

// Search POST /api/search
func (h *Handler) Search(c *fiber.Ctx) error {
	var req SearchRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	// NSFW 过滤：对齐 common/handler.go 的规则
	contentLimit := getNSFWFilter(c)

	// 调 Wiki 搜索
	params := galgameClient.SearchGalgameParams{
		Q:             req.Q,
		ContentLimit:  contentLimit,
		AgeLimit:      req.AgeLimit,
		OriginalLang:  req.OriginalLang,
		TagIDs:        req.TagIDs,
		OfficialIDs:   req.OfficialIDs,
		EngineIDs:     req.EngineIDs,
		ReleasedFrom:  req.ReleasedFrom,
		ReleasedTo:    req.ReleasedTo,
		IncludeIntro:  req.IncludeIntro,
		Sort:          req.Sort,
		Page:          req.Page,
		Limit:         req.Limit,
	}
	wikiResult, err := h.wiki.SearchGalgame(c.Context(), params)
	if err != nil {
		slog.Error("Wiki 搜索失败", "error", err)
		return response.Error(c, errors.ErrInternal("搜索服务暂不可用"))
	}

	// 提取 vndb_id，查本地 patch 表
	vndbIDs := make([]string, 0, len(wikiResult.Items))
	for _, item := range wikiResult.Items {
		if item.VndbID != "" {
			vndbIDs = append(vndbIDs, item.VndbID)
		}
	}

	patchMap := map[string]*patchModel.Patch{}
	if len(vndbIDs) > 0 {
		var patches []patchModel.Patch
		if err := h.db.WithContext(c.Context()).
			Where("vndb_id IN ?", vndbIDs).
			Find(&patches).Error; err != nil {
			slog.Error("查询本地 patch 失败", "error", err)
			return response.Error(c, errors.ErrInternal(""))
		}
		for i := range patches {
			patchMap[patches[i].VndbID] = &patches[i]
		}
	}

	// 合并：按 Wiki 相关度顺序，给每条打上 has_patch + patch 详情
	hits := make([]SearchHit, 0, len(wikiResult.Items))
	for _, item := range wikiResult.Items {
		h := SearchHit{GalgameHit: item}
		if p, ok := patchMap[item.VndbID]; ok {
			h.HasPatch = true
			h.Patch = p
		}
		hits = append(hits, h)
	}

	return response.Paginated(c, hits, wikiResult.Total)
}

// getNSFWFilter 对齐 common/handler.go 的解析。
func getNSFWFilter(c *fiber.Ctx) string {
	nsfw := c.Get("x-nsfw-header", "{}")
	var opt struct {
		ShowNSFW bool `json:"showNSFW"`
	}
	_ = json.Unmarshal([]byte(nsfw), &opt)
	if !opt.ShowNSFW {
		return "sfw"
	}
	return ""
}
