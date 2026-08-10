package moemoepoint

import (
	"context"
	"log/slog"

	"gorm.io/gorm"
)

type Awarder struct {
	client *Client
	db     *gorm.DB
}

func NewAwarder(client *Client, db *gorm.DB) *Awarder {
	return &Awarder{client: client, db: db}
}

func (a *Awarder) Award(ctx context.Context, userID, delta int, reason, ref, idemKey string) {
	if a == nil || a.client == nil || delta == 0 {
		return
	}
	res, err := a.client.Adjust(ctx, userID, AdjustRequest{
		Delta:          delta,
		Reason:         reason,
		Ref:            ref,
		ActorUserID:    0,
		IdempotencyKey: idemKey,
	})
	if err != nil {
		slog.Warn("moemoepoint award failed (best-effort, skipped)",
			"user_id", userID, "delta", delta, "reason", reason, "ref", ref, "error", err)
		return
	}
	// OAuth owns the balance; this local column only mirrors the authoritative response.
	if err := a.db.WithContext(ctx).
		Exec(`UPDATE "user" SET moemoepoint = ? WHERE id = ?`, res.Balance, userID).Error; err != nil {
		slog.Warn("moemoepoint cache sync failed",
			"user_id", userID, "balance", res.Balance, "error", err)
	}
}

func (a *Awarder) Log(ctx context.Context, userID, limit int, beforeID int64, reason string) ([]LogEntry, bool, error) {
	if a == nil || a.client == nil {
		return []LogEntry{}, false, nil
	}
	return a.client.Log(ctx, userID, limit, beforeID, reason)
}

func (a *Awarder) Balance(ctx context.Context, userID int) (int, error) {
	if a == nil || a.client == nil {
		return 0, nil
	}
	return a.client.Balance(ctx, userID)
}
