// Package enricher 把本地 patch 结果富化为前端直接消费的形状。
//
// D12（2026-04-21）：patch 表不再存游戏元数据，通过 galgame_id 向 Wiki /galgame/batch
// 批量拉取后，组装成前端 GalgameCard 期望的结构：
//
//	{
//	  id, vndbId, bid, banner, view, download,
//	  name: { "en-us", "ja-jp", "zh-cn", "zh-tw" },
//	  type, language, platform,
//	  content_limit, status, created, resourceUpdateTime,
//	  _count: { favorite_by, contribute_by, resource, comment },
//	  galgame: { ...Wiki 原始字段，供详情页可选使用 }
//	}
//
// Wiki 失败时字符串字段为空、_count 仍真实，保证前端不崩溃。
package enricher

import (
	"context"
	"log/slog"
	"time"

	galgameClient "kun-galgame-patch-api/internal/galgame/client"
	patchModel "kun-galgame-patch-api/internal/patch/model"
)

// KunLanguage 对齐前端 KunLanguage（4 语言）。
type KunLanguage struct {
	EnUs string `json:"en-us"`
	JaJp string `json:"ja-jp"`
	ZhCn string `json:"zh-cn"`
	ZhTw string `json:"zh-tw"`
}

// Counts 对齐前端的 `_count` 嵌套对象。
type Counts struct {
	FavoriteBy   int `json:"favorite_by"`
	ContributeBy int `json:"contribute_by"`
	Resource     int `json:"resource"`
	Comment      int `json:"comment"`
}

// GalgameCard 是前端 `interface GalgameCard` 的 Go 镜像。
// JSON tag 严格对齐前端期望的 key（含 camelCase 的 `vndbId` / `resourceUpdateTime`）。
type GalgameCard struct {
	ID                 int                          `json:"id"`
	Name               KunLanguage                  `json:"name"`
	VndbID             string                       `json:"vndbId"`
	BID                *int                         `json:"bid"`
	Banner             string                       `json:"banner"`
	View               int                          `json:"view"`
	Download           int                          `json:"download"`
	Type               patchModel.JSONArray         `json:"type"`
	Language           patchModel.JSONArray         `json:"language"`
	Platform           patchModel.JSONArray         `json:"platform"`
	ContentLimit       string                       `json:"content_limit"`
	Status             int                          `json:"status"`
	Created            time.Time                    `json:"created"`
	ResourceUpdateTime time.Time                    `json:"resourceUpdateTime"`
	Count              Counts                       `json:"_count"`
	User               *patchModel.PatchUser        `json:"user,omitempty"`
	Galgame            *galgameClient.GalgameBrief  `json:"galgame,omitempty"`
}

// EnrichPatches 把一批本地 patch + Wiki 富化到前端可直接渲染的 GalgameCard 列表。
//
// 单次 /galgame/batch 调用覆盖全部 galgame_id。Wiki 失败时仅本地字段可用（name 为空串）。
func EnrichPatches(ctx context.Context, wiki *galgameClient.Client, patches []patchModel.Patch) []GalgameCard {
	cards := make([]GalgameCard, len(patches))
	for i := range patches {
		cards[i] = baseCard(&patches[i])
	}
	if wiki == nil || len(patches) == 0 {
		return cards
	}

	ids := collectGalgameIDs(patches)
	if len(ids) == 0 {
		return cards
	}

	briefs, err := wiki.GalgameBatch(ctx, ids)
	if err != nil {
		slog.Warn("Wiki 富化失败，返回无 galgame 的降级结果", "error", err, "count", len(patches))
		return cards
	}
	byID := make(map[int]*galgameClient.GalgameBrief, len(briefs))
	for i := range briefs {
		byID[briefs[i].ID] = &briefs[i]
	}

	for i := range cards {
		if g, ok := byID[patches[i].GalgameID]; ok {
			applyGalgame(&cards[i], g)
		}
	}
	return cards
}

// EnrichPatch 单条富化（详情页用）。
func EnrichPatch(ctx context.Context, wiki *galgameClient.Client, p *patchModel.Patch) GalgameCard {
	if p == nil {
		return GalgameCard{}
	}
	card := baseCard(p)
	if wiki == nil || p.GalgameID <= 0 {
		return card
	}
	briefs, err := wiki.GalgameBatch(ctx, []int{p.GalgameID})
	if err != nil || len(briefs) == 0 {
		slog.Warn("Wiki 富化失败", "patch_id", p.ID, "error", err)
		return card
	}
	applyGalgame(&card, &briefs[0])
	return card
}

// ─── helpers ──────────────────────────────────────

func collectGalgameIDs(patches []patchModel.Patch) []int {
	seen := map[int]struct{}{}
	ids := make([]int, 0, len(patches))
	for _, p := range patches {
		if p.GalgameID <= 0 {
			continue
		}
		if _, ok := seen[p.GalgameID]; ok {
			continue
		}
		seen[p.GalgameID] = struct{}{}
		ids = append(ids, p.GalgameID)
	}
	return ids
}

// baseCard 从 patch 生成卡片的本地字段部分（Name/Banner 等 Wiki 字段先留空）。
func baseCard(p *patchModel.Patch) GalgameCard {
	return GalgameCard{
		ID:                 p.ID,
		VndbID:             p.VndbID,
		BID:                p.BID,
		View:               p.View,
		Download:           p.Download,
		Type:               p.Type,
		Language:           p.Language,
		Platform:           p.Platform,
		Status:             p.Status,
		Created:            p.Created,
		ResourceUpdateTime: p.ResourceUpdateTime,
		Count: Counts{
			FavoriteBy:   p.FavoriteCount,
			ContributeBy: p.ContributeCount,
			Resource:     p.ResourceCount,
			Comment:      p.CommentCount,
		},
		User: p.User,
	}
}

// applyGalgame 把 Wiki 的 galgame 信息合并到卡片上。
func applyGalgame(card *GalgameCard, g *galgameClient.GalgameBrief) {
	card.Name = KunLanguage{
		EnUs: g.NameEnUs,
		JaJp: g.NameJaJp,
		ZhCn: g.NameZhCn,
		ZhTw: g.NameZhTw,
	}
	card.Banner = g.Banner
	card.ContentLimit = g.ContentLimit
	card.Galgame = g
}
