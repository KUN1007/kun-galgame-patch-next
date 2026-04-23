// Package enricher 把本地 patch 结果用 Wiki /galgame/batch 的信息富化。
//
// 使用场景：home、galgame 列表、用户资料页的补丁列表、patch 详情等等，
// 凡是返回 patch 给前端的地方，都需要补上游戏名/封面/介绍等元数据。
//
// D12（2026-04-21）：patch 表不再存储这些字段，全部通过 galgame_id 向 Wiki 拉取。
package enricher

import (
	"context"
	"log/slog"

	galgameClient "kun-galgame-patch-api/internal/galgame/client"
	patchModel "kun-galgame-patch-api/internal/patch/model"
)

// PatchCard 是富化后的 patch —— 嵌入原 patch 所有字段 + 平级 galgame 字段。
//
// JSON 形如：
//
//	{
//	  "id": 1, "vndb_id": "v123", "user_id": 5, "view": 10, ...
//	  "galgame": { "id": 42, "name_zh_cn": "...", "banner": "..." }
//	}
type PatchCard struct {
	*patchModel.Patch
	Galgame *galgameClient.GalgameBrief `json:"galgame,omitempty"`
}

// EnrichPatches 批量富化：一次 /galgame/batch 调用拿到所有 galgame，
// 按 galgame_id 合并到每个 patch 上。Wiki 失败时降级为只返回 patch 本身（Galgame=nil）。
func EnrichPatches(ctx context.Context, wiki *galgameClient.Client, patches []patchModel.Patch) []PatchCard {
	cards := make([]PatchCard, len(patches))
	for i := range patches {
		cards[i] = PatchCard{Patch: &patches[i]}
	}

	if wiki == nil || len(patches) == 0 {
		return cards
	}

	// 收集去重后的 galgame_id
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
	if len(ids) == 0 {
		return cards
	}

	briefs, err := wiki.GalgameBatch(ctx, ids)
	if err != nil {
		slog.Warn("Wiki 富化失败，降级返回无 galgame 字段", "error", err, "count", len(patches))
		return cards
	}
	byID := make(map[int]*galgameClient.GalgameBrief, len(briefs))
	for i := range briefs {
		byID[briefs[i].ID] = &briefs[i]
	}

	for i := range cards {
		if g, ok := byID[cards[i].GalgameID]; ok {
			cards[i].Galgame = g
		}
	}
	return cards
}

// EnrichPatch 单条富化（详情页用）。
func EnrichPatch(ctx context.Context, wiki *galgameClient.Client, p *patchModel.Patch) PatchCard {
	card := PatchCard{Patch: p}
	if wiki == nil || p == nil || p.GalgameID <= 0 {
		return card
	}
	briefs, err := wiki.GalgameBatch(ctx, []int{p.GalgameID})
	if err != nil || len(briefs) == 0 {
		return card
	}
	card.Galgame = &briefs[0]
	return card
}
