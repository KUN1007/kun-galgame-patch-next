package cron

// Catalog claim transitions → local notifications + moemoepoint.
//
// This replaces the wiki message sync, whose upstream (`galgame_message` and
// its /galgame/messages/feed) retires with the wiki tables in wave 161. The two
// feeds are not translations of each other, and the differences are what this
// file is mostly about:
//
//   - The wiki delivered TYPED messages (approved / declined / banned /
//     unbanned). The registry delivers TRANSITIONS (from_state, to_state). A
//     type word is a claim about intent; a transition is a fact, and one
//     destination can be reached by more than one route — `live` is reached both
//     by a reviewer approving a submission and by an owner publishing their own
//     draft, and only the first of those is an approval to announce.
//   - The wiki named the BENEFICIARY of each message (`target_user_id`). The
//     registry names the ACTOR, who on every review action is the REVIEWER.
//     Notifying or paying the actor would invert every effect below, so the
//     recipient is recovered from the transition INTO `pending`, which the cron
//     records as it goes past (claim_event_processed, migration 029).
//   - Both id spaces are small integers and disjoint, so the cursor row AND the
//     moemoepoint idempotency prefix both move into fresh namespaces. Sharing
//     either would let wiki message 42 be mistaken for claim event 42 —
//     silently, in both directions.
//
// Delivery semantics are unchanged and deliberately so: at-least-once plus
// idempotent side effects, one transaction per event covering the idempotency
// insert, the side effects and the cursor advance. The per-EVENT transaction
// (rather than per-page) is the 2026-05-30 F025 finding carried over: it bounds
// the synchronous OAuth award to one call per open transaction, so a slow OAuth
// cannot pin a connection across a whole feed page.

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
	// claimSyncCronName is the cron_state cursor row. A NEW name: the wiki row
	// (`wiki_msg_sync`) holds a wiki message id, and pointing this feed at it
	// would start the run at an arbitrary place in a different id space. The old
	// row is never written or deleted, so a rollback resumes exactly where it
	// stopped.
	claimSyncCronName = "catalog_claim_sync"
	claimSyncSchedule = "*/10 * * * *" // every 10 minutes, as the wiki sync was
	claimSyncBatch    = 500
	// claimSyncMaxPages bounds one run. The feed is ascending and the cursor is
	// durable, so a backlog longer than this is simply finished next tick.
	claimSyncMaxPages = 50
)

// RunClaimEventSync executes one sync cycle. Exported so it can be driven
// manually. Returns the number of events applied and the resulting cursor.
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
		// First run after the switch: position at the feed's head, do NOT ingest
		// from 0.
		//
		// This is a correctness requirement, not an optimisation. The window's
		// re-site step mints one backfill event per existing claim — tens of
		// thousands of them, most with to_state=live — and consuming those would
		// fire an "approved, +3 萌萌点" notification for every entry in the
		// registry. The feed exists to carry what happens NEXT.
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
				// Hold the cursor BEFORE this event; every effect is idempotent,
				// so the next tick re-applies it.
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

// claimFeedHead walks the feed once WITHOUT applying anything, to learn its
// current last id. Used only to seed a fresh cursor.
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

// claimEffect is what one transition asks moyu to do locally.
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

// effectOf maps one transition onto its local effect, reproducing the four wiki
// message types the old cron handled and nothing more.
//
// `live` needs the ORIGIN as well as the destination, because three different
// things arrive there:
//
//   - from `pending`  — a reviewer approved a submission. This is the +3.
//   - from `hidden`   — an unban restored the entry to what it was.
//   - from `draft`    — the owner published their own draft. moyu already pays
//     for that in the request path under its own idempotency key
//     (`moyu:claim:<gid>`), and the wiki feed never emitted a message for it
//     either, so announcing it here would both double-pay and double-notify.
//
// Two destinations do nothing on purpose: `draft` (a withdrawal is reversible
// and the entry was taken down, not judged) and `none` (a claim released back
// to the registry, which is not a verdict about anyone's submission).
func effectOf(ev *catalogclient.ClaimEventFeedItem) claimEffect {
	// No product-side anchor = nothing local to say. moyu's key space is the
	// gid, and a registry-only claim has no id in it; inventing one from the
	// work id would link the notification to a different game (doc 106 R3).
	if ev.ProductWorkID == nil || *ev.ProductWorkID <= 0 {
		return claimEffectNone
	}
	switch ev.ToState {
	case catalogclient.ClaimStateLive:
		switch {
		case ev.FromState == nil:
			// A claim born straight into `live` is an import, not a review.
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

// isGIDClaim reports whether a claim's site is the one whose product_work_id is
// a gid — moyu's own key space — under either spelling of the key.
//
// The window renames it from `galgame_wiki` to `kungal` in a step moyu does not
// deploy alongside, so the filter is applied HERE rather than as a `site=` on
// the request: a server-side filter naming one spelling would silently consume
// and discard every event on the other side of the rename, advancing the cursor
// past transitions it never applied. Client-side the cost is one comparison per
// event, and other tenants' events fall out with no effect.
func isGIDClaim(site string) bool {
	return site == "kungal" || site == "galgame_wiki"
}

// applyClaimEvent handles a single transition inside an open tx. It is the
// idempotency boundary: a non-zero RowsAffected on the INSERT means this is the
// first time we are seeing this event — only then do the side effects run.
func applyClaimEvent(
	ctx context.Context,
	tx *gorm.DB,
	galgame *galgameClient.Client,
	mp *moemoepoint.Client,
	ev *catalogclient.ClaimEventFeedItem,
) error {
	effect := effectOf(ev)
	if !isGIDClaim(ev.Site) {
		// Another product's tenant. Consume nothing, remember nothing — the
		// cursor still advances, which is the point of reading unfiltered.
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

	// Idempotency gate + the submitter ledger, one row. ON CONFLICT DO NOTHING;
	// RowsAffected == 0 means a prior run already applied this event.
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
		// The row above IS the memo; nothing else to do for a submission.
		return nil
	}

	gid := int(*ev.ProductWorkID)
	recipient, err := submitterOf(tx, ev.WorkID)
	if err != nil {
		return fmt.Errorf("look up submitter (work=%d): %w", ev.WorkID, err)
	}
	if recipient <= 0 {
		// Loud, and only ever a missing NOTIFICATION: the transition itself has
		// already happened upstream. A submission whose `pending` event predates
		// this cursor — every wiki-era one — has no recorded submitter, and the
		// actor on hand is the reviewer. Saying nothing is the only honest
		// option; saying it to the reviewer is not.
		slog.Error("claim 事件无法归属投稿人, 跳过通知与发奖",
			"event", ev.ID, "work", ev.WorkID, "gid", gid, "to_state", ev.ToState)
		return nil
	}

	// Ensure the recipient has a LOCAL user anchor before any user-FK'd write.
	// A submitter can exist in OAuth and have NEVER logged into moyu, and
	// user_message_recipient_id_fkey (23503) would roll the per-event tx back
	// forever, wedging the cursor and starving every later event (observed on
	// the wiki cron in prod: ~90 failures/72h, stuck at cursor 98).
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
		// +3 through OAuth, the single source of truth for the balance. The key
		// is per-EVENT and its prefix is new: `wiki_approved` holds wiki message
		// ids and the two sequences overlap numerically, so reusing it would let
		// one suppress the other's award. A failure returns an error → the tx
		// rolls back → the cursor holds → the next tick retries.
		if mp != nil {
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

// submitterOf reads the actor of the latest transition INTO `pending` for a
// work — the person the verdict is about. Zero when the cron never saw that
// transition go past.
func submitterOf(tx *gorm.DB, workID int64) (int, error) {
	var uid int
	err := tx.Raw(`
		SELECT actor_uid FROM claim_event_processed
		WHERE work_id = ? AND to_state = ?
		ORDER BY event_id DESC LIMIT 1
	`, workID, catalogclient.ClaimStatePending).Scan(&uid).Error
	return uid, err
}

// claimWorkName resolves a display name for the notification body. Best-effort
// enrichment outside the transaction's business: a lookup failure degrades to
// the id rather than holding up a verdict the user is waiting on.
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

// writeClaimNotification inserts the local user_message row, linking to the
// patch page so the recipient is one click from the entry.
//
// GORM Create rather than a raw INSERT: the model's autoCreateTime tags
// populate `created` / `updated`, both NOT NULL without a default.
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

// readClaimCursor distinguishes "never seeded" from "0", which a bare int64
// cannot express and which must not be conflated: the first means seed at the
// head, the second would mean replay the entire backfill.
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
