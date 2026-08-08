package enricher

import (
	"context"
	"log/slog"

	galgameClient "kun-galgame-patch-api/internal/galgame/client"
)

func FilterByGalgameContentLimit[T any](
	ctx context.Context,
	galgame *galgameClient.Client,
	items []T,
	gidOf func(T) int,
	cl string,
) []T {
	if cl == "" || len(items) == 0 || galgame == nil {
		return items
	}
	seen := make(map[int]struct{}, len(items))
	gids := make([]int, 0, len(items))
	for _, it := range items {
		gid := gidOf(it)
		if gid <= 0 {
			continue
		}
		if _, ok := seen[gid]; ok {
			continue
		}
		seen[gid] = struct{}{}
		gids = append(gids, gid)
	}
	if len(gids) == 0 {
		return items
	}

	briefs, err := galgame.GalgameBatch(ctx, gids, cl)
	if err != nil {
		slog.Warn("NSFW filter: galgame batch 失败，返回空 slice 兜底以防泄漏", "error", err, "content_limit", cl, "count", len(items))
		return nil
	}
	allowed := make(map[int]struct{}, len(briefs))
	for i := range briefs {
		allowed[briefs[i].ID] = struct{}{}
	}

	out := items[:0]
	for _, it := range items {
		if _, ok := allowed[gidOf(it)]; ok {
			out = append(out, it)
		}
	}
	return out
}
