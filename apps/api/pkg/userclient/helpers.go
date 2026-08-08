package userclient

import (
	"context"
	"log/slog"
)

func BriefMapByInt(ctx context.Context, c *Client, ids []int) map[int]*Brief {
	if c == nil || len(ids) == 0 {
		return map[int]*Brief{}
	}
	seen := make(map[uint]struct{}, len(ids))
	clean := make([]uint, 0, len(ids))
	for _, id := range ids {
		if id <= 0 {
			continue
		}
		u := uint(id)
		if _, ok := seen[u]; ok {
			continue
		}
		seen[u] = struct{}{}
		clean = append(clean, u)
	}
	if len(clean) == 0 {
		return map[int]*Brief{}
	}
	briefs, err := c.Users(ctx, clean)
	if err != nil {
		slog.Warn("oauth users/batch failed; user briefs unfilled",
			"count", len(clean), "error", err)
		return map[int]*Brief{}
	}
	out := make(map[int]*Brief, len(briefs))
	for id, b := range briefs {
		out[int(id)] = b
	}
	return out
}
