package cron

import (
	"context"
	"fmt"
	"log/slog"

	authModel "kun-galgame-patch-api/internal/auth/model"
	galgameClient "kun-galgame-patch-api/internal/galgame/client"
	userModel "kun-galgame-patch-api/internal/user/model"
	"kun-galgame-patch-api/pkg/catalogclient"
	"kun-galgame-patch-api/pkg/moemoepoint"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	// Catalog and retired wiki feeds have unrelated ID spaces; reusing
	// wiki_msg_sync skips or replays events silently.
	claimSyncCronName = "catalog_claim_sync"
	claimSyncSchedule = "*/10 * * * *"
	claimSyncBatch    = 500
	claimSyncMaxPages = 50
)

func RunClaimEventSync(
	ctx context.Context,
	db *gorm.DB,
	catalog *catalogclient.Client,
	galgame *galgameClient.Client,
	mp *moemoepoint.Client,
) (int, int64, error) {
	if db == nil || catalog == nil || !catalog.Configured() {
		return 0, 0, fmt.Errorf("claim event sync: missing db or catalog client")
	}

	cursor, seeded, err := readClaimCursor(db)
	if err != nil {
		return 0, 0, err
	}
	if !seeded {
		head, herr := claimFeedHead(ctx, catalog)
		if herr != nil {
			return 0, 0, fmt.Errorf("seek claim feed head: %w", herr)
		}
		if werr := writeClaimCursor(db, head); werr != nil {
			return 0, 0, werr
		}
		slog.Info("catalog claim 同步已初始化游标 (不回填历史)", "head", head)
		return 0, head, nil
	}

	applied := 0
	for page := 1; page <= claimSyncMaxPages; page++ {
		feed, ferr := catalog.ClaimEventsSince(ctx, cursor, claimSyncBatch, "")
		if ferr != nil {
			return applied, cursor, fmt.Errorf("fetch claim feed: %w", ferr)
		}
		if len(feed.Items) == 0 {
			break
		}
		for i := range feed.Items {
			ev := &feed.Items[i]
			next := ev.ID
			txErr := db.Transaction(func(tx *gorm.DB) error {
				if err := applyClaimEvent(ctx, tx, galgame, mp, ev); err != nil {
					return err
				}
				return writeClaimCursorTx(tx, next)
			})
			if txErr != nil {
				return applied, cursor, txErr
			}
			cursor = next
			applied++
		}
		if len(feed.Items) < claimSyncBatch {
			break
		}
	}
	return applied, cursor, nil
}

func claimFeedHead(ctx context.Context, catalog *catalogclient.Client) (int64, error) {
	var head int64
	for page := 1; page <= claimSyncMaxPages; page++ {
		feed, err := catalog.ClaimEventsSince(ctx, head, claimSyncBatch, "")
		if err != nil {
			return 0, err
		}
		if len(feed.Items) == 0 {
			break
		}
		head = feed.Items[len(feed.Items)-1].ID
		if len(feed.Items) < claimSyncBatch {
			break
		}
	}
	return head, nil
}

type claimEffect int

const (
	claimEffectNone claimEffect = iota
	claimEffectApproved
	claimEffectDeclined
	claimEffectBanned
	claimEffectUnbanned
	claimEffectRememberSubmitter
	claimEffectUnknownState
)

func effectOf(ev *catalogclient.ClaimEventFeedItem) claimEffect {
	if ev.ProductWorkID == nil || *ev.ProductWorkID <= 0 {
		return claimEffectNone
	}
	switch ev.ToState {
	case catalogclient.ClaimStateLive:
		switch {
		case ev.FromState == nil:
			// A claim born directly into live is an import, not an approval.
			return claimEffectNone
		case *ev.FromState == catalogclient.ClaimStatePending:
			return claimEffectApproved
		case *ev.FromState == catalogclient.ClaimStateHidden:
			return claimEffectUnbanned
		default:
			return claimEffectNone
		}
	case catalogclient.ClaimStateDeclined:
		return claimEffectDeclined
	case catalogclient.ClaimStateHidden:
		return claimEffectBanned
	case catalogclient.ClaimStatePending:
		return claimEffectRememberSubmitter
	case catalogclient.ClaimStateDraft, catalogclient.ClaimStateNone:
		return claimEffectNone
	default:
		return claimEffectUnknownState
	}
}

func applyClaimEvent(
	ctx context.Context,
	tx *gorm.DB,
	galgame *galgameClient.Client,
	mp *moemoepoint.Client,
	ev *catalogclient.ClaimEventFeedItem,
) error {
	effect := effectOf(ev)
	if !catalogclient.IsGIDClaimSite(ev.Site) {
		return nil
	}
	if effect == claimEffectUnknownState {
		slog.Warn("收到未识别的 claim 目标状态, 跳过",
			"event", ev.ID, "state", ev.ToState, "work", ev.WorkID)
		return nil
	}
	if effect == claimEffectNone {
		return nil
	}

	res := tx.Exec(`
		INSERT INTO claim_event_processed(event_id, work_id, to_state, actor_uid)
		VALUES (?, ?, ?, ?)
		ON CONFLICT(event_id) DO NOTHING
	`, ev.ID, ev.WorkID, ev.ToState, ev.ActorUID)
	if res.Error != nil {
		return fmt.Errorf("idempotency insert: %w", res.Error)
	}
	if res.RowsAffected == 0 {
		return nil
	}
	if effect == claimEffectRememberSubmitter {
		return nil
	}

	gid := int(*ev.ProductWorkID)
	recipient, err := submitterOf(tx, ev.WorkID)
	if err != nil {
		return fmt.Errorf("look up submitter (work=%d): %w", ev.WorkID, err)
	}
	if recipient <= 0 {
		slog.Error("claim 事件无法归属投稿人, 跳过通知与发奖",
			"event", ev.ID, "work", ev.WorkID, "gid", gid, "to_state", ev.ToState)
		return nil
	}

	if err := tx.Clauses(clause.OnConflict{DoNothing: true}).
		Create(&authModel.User{ID: recipient}).Error; err != nil {
		return fmt.Errorf("ensure recipient user anchor (uid=%d): %w", recipient, err)
	}

	name := claimWorkName(ctx, galgame, gid)
	reason := ""
	if ev.Reason != nil {
		reason = *ev.Reason
	}

	switch effect {
	case claimEffectApproved:
		if mp != nil {
			// Claim event IDs overlap retired wiki message IDs, so their award keys
			// need a separate namespace.
			awarded, aerr := mp.Adjust(ctx, recipient, moemoepoint.AdjustRequest{
				Delta:          3,
				Reason:         "content_approved",
				Ref:            fmt.Sprintf("galgame:%d", gid),
				IdempotencyKey: fmt.Sprintf("moyu:claim_approved:%d", ev.ID),
			})
			if aerr != nil {
				return fmt.Errorf("award moemoepoint: %w", aerr)
			}
			if uerr := tx.Exec(
				`UPDATE "user" SET moemoepoint = ? WHERE id = ?`, awarded.Balance, recipient,
			).Error; uerr != nil {
				return fmt.Errorf("sync moemoepoint cache: %w", uerr)
			}
		}
		return writeClaimNotification(tx, recipient, gid,
			fmt.Sprintf("您提交的《%s》已通过审核，奖励 +3 萌萌点", name))
	case claimEffectDeclined:
		text := fmt.Sprintf("您提交的《%s》未通过审核", name)
		if reason != "" {
			text += "：" + reason
		}
		return writeClaimNotification(tx, recipient, gid, text)
	case claimEffectBanned:
		text := fmt.Sprintf("您的作品《%s》已被封禁", name)
		if reason != "" {
			text += "：" + reason
		}
		return writeClaimNotification(tx, recipient, gid, text)
	case claimEffectUnbanned:
		return writeClaimNotification(tx, recipient, gid,
			fmt.Sprintf("您的作品《%s》已解除封禁", name))
	}
	return nil
}

func submitterOf(tx *gorm.DB, workID int64) (int, error) {
	var uid int
	err := tx.Raw(`
		SELECT actor_uid FROM claim_event_processed
		WHERE work_id = ? AND to_state = ?
		ORDER BY event_id DESC LIMIT 1
	`, workID, catalogclient.ClaimStatePending).Scan(&uid).Error
	return uid, err
}

func claimWorkName(ctx context.Context, galgame *galgameClient.Client, gid int) string {
	if galgame != nil {
		if briefs, err := galgame.GalgameBatch(ctx, []int{gid}, ""); err == nil {
			for i := range briefs {
				if briefs[i].ID != gid {
					continue
				}
				for _, s := range []string{
					briefs[i].NameZhCn, briefs[i].NameZhTw, briefs[i].NameJaJp, briefs[i].NameEnUs,
				} {
					if s != "" {
						return s
					}
				}
			}
		}
	}
	return fmt.Sprintf("#%d", gid)
}

func writeClaimNotification(tx *gorm.DB, recipient, gid int, text string) error {
	return tx.Create(&userModel.UserMessage{
		Type:        "system",
		Content:     text,
		Status:      0,
		Link:        fmt.Sprintf("/patch/%d/introduction", gid),
		SenderID:    nil,
		RecipientID: &recipient,
	}).Error
}

func readClaimCursor(db *gorm.DB) (cursor int64, seeded bool, err error) {
	var rows []int64
	if err := db.Raw(
		`SELECT last_id FROM cron_state WHERE name = ?`, claimSyncCronName,
	).Scan(&rows).Error; err != nil {
		return 0, false, fmt.Errorf("read claim cron cursor: %w", err)
	}
	if len(rows) == 0 {
		return 0, false, nil
	}
	return rows[0], true, nil
}

func writeClaimCursor(db *gorm.DB, id int64) error { return writeClaimCursorTx(db, id) }

func writeClaimCursorTx(tx *gorm.DB, id int64) error {
	return tx.Exec(`
		INSERT INTO cron_state(name, last_id, updated_at)
		VALUES (?, ?, NOW())
		ON CONFLICT(name) DO UPDATE
		SET last_id = EXCLUDED.last_id, updated_at = EXCLUDED.updated_at
	`, claimSyncCronName, id).Error
}
