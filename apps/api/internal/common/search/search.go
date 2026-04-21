// Package search 提供 POST /api/search 端点和从 DB 到 Meilisearch 的同步逻辑。
package search

import (
	"context"
	"encoding/json"
	"log/slog"
	"strings"

	"kun-galgame-patch-api/internal/infrastructure/search"
	patchModel "kun-galgame-patch-api/internal/patch/model"
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/response"
	"kun-galgame-patch-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// Handler 提供搜索端点和启动时的全量索引。
type Handler struct {
	db     *gorm.DB
	search *search.Client
}

// New 构造 Handler。
func New(db *gorm.DB, searchClient *search.Client) *Handler {
	return &Handler{db: db, search: searchClient}
}

// SearchRequest 搜索请求体。
type SearchRequest struct {
	Query []string `json:"query" validate:"required,min=1,max=10,dive,min=1,max=107"`
	Page  int      `json:"page" validate:"required,min=1"`
	Limit int      `json:"limit" validate:"required,min=1,max=50"`
}

// Search POST /api/search
func (h *Handler) Search(c *fiber.Ctx) error {
	var req SearchRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	if !h.search.Ready() {
		return response.Error(c, errors.ErrInternal("搜索服务暂不可用"))
	}

	// NSFW 过滤：对齐 common/handler.go 的 getNSFWFilter
	nsfwFilter := getNSFWFilter(c)

	// Meilisearch 以空格拼接多关键词，自带相关性排序
	q := joinQueries(req.Query)

	hits, total, err := h.search.SearchPatches(c.Context(), q, req.Page, req.Limit, nsfwFilter)
	if err != nil {
		slog.Error("Meilisearch 搜索失败", "error", err)
		return response.Error(c, errors.ErrInternal("搜索失败"))
	}

	return response.Paginated(c, hits, total)
}

// ReindexAllPatches 启动时的全量索引：把 DB 里所有 patch 推到 Meilisearch。
// 非阻塞调用：此函数内部失败只记日志。
func (h *Handler) ReindexAllPatches(ctx context.Context) {
	if !h.search.Ready() {
		return
	}
	if err := h.search.EnsurePatchIndex(ctx); err != nil {
		slog.Error("初始化 patch 索引失败", "error", err)
		return
	}

	// 流式分页读取，避免 OOM
	const batch = 500
	var offset int
	var indexed int

	for {
		var patches []patchModel.Patch
		if err := h.db.WithContext(ctx).
			Preload("Aliases").
			Preload("Tags.Tag").
			Order("id ASC").
			Offset(offset).Limit(batch).
			Find(&patches).Error; err != nil {
			slog.Error("读取 patch 失败", "error", err, "offset", offset)
			return
		}
		if len(patches) == 0 {
			break
		}

		docs := make([]search.PatchDocument, 0, len(patches))
		for _, p := range patches {
			docs = append(docs, patchToDocument(&p))
		}
		if err := h.search.UpsertPatches(ctx, docs); err != nil {
			slog.Error("写入 Meilisearch 失败", "error", err, "offset", offset)
			return
		}
		indexed += len(patches)
		offset += batch
	}
	slog.Info("Meilisearch 全量索引完成", "count", indexed)
}

// patchToDocument 把 GORM model 转成 Meilisearch 文档。
func patchToDocument(p *patchModel.Patch) search.PatchDocument {
	vndbID := ""
	if p.VndbID != nil {
		vndbID = *p.VndbID
	}

	aliases := make([]string, 0, len(p.Aliases))
	for _, a := range p.Aliases {
		aliases = append(aliases, a.Name)
	}

	tags := make([]string, 0, len(p.Tags))
	for _, t := range p.Tags {
		if t.Tag != nil && t.Tag.Name != "" {
			tags = append(tags, t.Tag.Name)
		}
	}

	return search.PatchDocument{
		ID:               p.ID,
		NameEnUs:         p.NameEnUs,
		NameZhCn:         p.NameZhCn,
		NameJaJp:         p.NameJaJp,
		VndbID:           vndbID,
		IntroductionEnUs: p.IntroductionEnUs,
		IntroductionZhCn: p.IntroductionZhCn,
		IntroductionJaJp: p.IntroductionJaJp,
		Alias:            aliases,
		Tags:             tags,
		ContentLimit:     p.ContentLimit,
		Created:          p.Created.Unix(),
	}
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

func joinQueries(qs []string) string {
	return strings.Join(qs, " ")
}
