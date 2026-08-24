package search

import (
	"log/slog"

	galgameClient "kun-galgame-patch-api/internal/galgame/client"
	patchModel "kun-galgame-patch-api/internal/patch/model"
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/response"
	"kun-galgame-patch-api/pkg/utils"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

type Handler struct {
	db      *gorm.DB
	galgame *galgameClient.Client
}

func New(db *gorm.DB, galgame *galgameClient.Client) *Handler {
	return &Handler{db: db, galgame: galgame}
}

type SearchRequest struct {
	Q            string `json:"q" validate:"max=200"`
	TagIDs       []int  `json:"tag_ids" validate:"omitempty,max=10,dive,min=1"`
	OfficialIDs  []int  `json:"official_ids" validate:"omitempty,max=1,dive,min=1"`
	EngineIDs    []int  `json:"engine_ids" validate:"omitempty,max=1,dive,min=1"`
	OriginalLang string `json:"original_language" validate:"max=100"`
	AgeLimit     string `json:"age_limit" validate:"omitempty,oneof=all r18"`
	ReleasedFrom int    `json:"released_from" validate:"omitempty,min=1970,max=2200"`
	ReleasedTo   int    `json:"released_to" validate:"omitempty,min=1970,max=2200"`
	IncludeIntro bool   `json:"include_intro"`
	Sort         string `json:"sort" validate:"omitempty,oneof=relevance released_desc released_asc view updated popularity"`
	Page         int    `json:"page" validate:"required,min=1"`
	Limit        int    `json:"limit" validate:"required,min=1,max=50"`
}

type SearchHit struct {
	galgameClient.GalgameHit
	HasPatch bool              `json:"has_patch"`
	Patch    *patchModel.Patch `json:"patch,omitempty"`
}

func (h *Handler) Search(c fiber.Ctx) error {
	var req SearchRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	contentLimit := utils.ContentLimitAll

	params := galgameClient.SearchGalgameParams{
		Q:            req.Q,
		ContentLimit: contentLimit,
		AgeLimit:     req.AgeLimit,
		OriginalLang: req.OriginalLang,
		TagIDs:       req.TagIDs,
		OfficialIDs:  req.OfficialIDs,
		EngineIDs:    req.EngineIDs,
		ReleasedFrom: req.ReleasedFrom,
		ReleasedTo:   req.ReleasedTo,
		SearchIntro:  req.IncludeIntro,
		Sort:         req.Sort,
		Page:         req.Page,
		Limit:        req.Limit,
	}
	galgameResult, err := h.galgame.SearchGalgame(c.Context(), params)
	if err != nil {
		if gerr, ok := galgameClient.AsBadRequest(err); ok {
			slog.Warn("galgame 搜索参数被上游拒绝", "error", err)
			return response.Error(c, errors.ErrBadRequest(gerr.Message))
		}
		slog.Error("galgame 搜索失败", "error", err)
		return response.Error(c, errors.ErrInternal("搜索服务暂不可用"))
	}

	ids := make([]int, 0, len(galgameResult.Items))
	vndbIDs := make([]string, 0, len(galgameResult.Items))
	for _, item := range galgameResult.Items {
		if item.ID > 0 {
			ids = append(ids, item.ID)
		}
		if item.VndbID != "" {
			vndbIDs = append(vndbIDs, item.VndbID)
		}
	}

	patchByID := map[int]*patchModel.Patch{}
	patchByVndb := map[string]*patchModel.Patch{}
	if len(ids) > 0 || len(vndbIDs) > 0 {
		var patches []patchModel.Patch
		q := h.db.WithContext(c.Context())
		switch {
		case len(ids) > 0 && len(vndbIDs) > 0:
			q = q.Where("id IN ? OR vndb_id IN ?", ids, vndbIDs)
		case len(ids) > 0:
			q = q.Where("id IN ?", ids)
		default:
			q = q.Where("vndb_id IN ?", vndbIDs)
		}
		if err := q.Find(&patches).Error; err != nil {
			slog.Error("查询本地 patch 失败", "error", err)
			return response.Error(c, errors.ErrInternal(""))
		}
		for i := range patches {
			p := &patches[i]
			patchByID[p.ID] = p
			if p.VndbID != "" {
				patchByVndb[p.VndbID] = p
			}
		}
	}

	hits := make([]SearchHit, 0, len(galgameResult.Items))
	for _, item := range galgameResult.Items {
		row := SearchHit{GalgameHit: item}
		if p := patchByID[item.ID]; p != nil {
			row.HasPatch = true
			row.Patch = p
		} else if p := patchByVndb[item.VndbID]; p != nil {
			row.HasPatch = true
			row.Patch = p
		}
		hits = append(hits, row)
	}

	return response.Paginated(c, hits, galgameResult.Total)
}
