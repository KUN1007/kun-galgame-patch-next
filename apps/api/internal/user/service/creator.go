package service

import (
	"context"
	"encoding/json"
	"log/slog"

	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/userclient"
)

// Moyu creator-eligibility thresholds — moyu's OWN policy (change freely here;
// OAuth + the registry are untouched). A user may apply if ANY criterion is
// met: ≥3 published patch resources (moyu's own data) OR ≥2000 moemoepoint
// (OAuth's authoritative balance, C3) OR ≥5 merged edit proposals (registry
// data). See docs/auth/01-creator-role-design.md.
const (
	creatorMinMergedPRs   = 5
	creatorMinResources   = 3
	creatorMinMoemoepoint = 2000
	creatorSource         = "moyu"
)

// CreatorEligibility is the moyu-side eligibility snapshot (counts vs thresholds).
//
// MergedPRs counts MERGED EDIT PROPOSALS. The wire name is the wiki-era "merged
// PRs" and stays: it is a public field the frontend renders and a column in the
// evidence blob recorded on every application, and the thing it counts did not
// change — the editing engine's proposals ARE what the wiki called PRs, re-homed
// onto the registry.
type CreatorEligibility struct {
	Eligible        bool  `json:"eligible"`
	MergedPRs       int64 `json:"merged_prs"`
	Resources       int64 `json:"resources"`
	Moemoepoint     int64 `json:"moemoepoint"`
	NeedMergedPRs   int   `json:"need_merged_prs"`
	NeedResources   int   `json:"need_resources"`
	NeedMoemoepoint int   `json:"need_moemoepoint"`
}

func (s *UserService) creatorEligibility(ctx context.Context, userID int) (*CreatorEligibility, *errors.AppError) {
	// Merged edit proposals, from the registry's own list face under a filter —
	// the wiki's /galgame/user/:id/stats retires with the wiki tables and the
	// count it served has no other successor.
	//
	// A failure degrades to 0 instead of failing the snapshot, which is how the
	// moemoepoint leg below has always behaved and what this one should have
	// done all along: it is ONE of three OR criteria, so an upstream blip used
	// to deny eligibility to a user who already qualified on resources alone.
	var mergedProposals int64
	if s.catalog != nil && s.catalog.Configured() {
		n, err := s.catalog.MergedProposalTotal(ctx, userID)
		if err != nil {
			slog.Warn("读取合并提案数失败，按 0 计", "user_id", userID, "error", err)
		} else {
			mergedProposals = n
		}
	}
	resources := s.repo.CountPublishedPatchResources(userID)
	// Authoritative OAuth balance (C3 single source, not the local cache). A
	// fetch miss degrades to 0 — it's one of several OR criteria, so it must not
	// fail the whole snapshot; the user can still qualify via resources / PRs.
	moe, _ := s.mp.Balance(ctx, userID)
	e := &CreatorEligibility{
		MergedPRs:       mergedProposals,
		Resources:       resources,
		Moemoepoint:     int64(moe),
		NeedMergedPRs:   creatorMinMergedPRs,
		NeedResources:   creatorMinResources,
		NeedMoemoepoint: creatorMinMoemoepoint,
	}
	e.Eligible = e.MergedPRs >= creatorMinMergedPRs ||
		e.Resources >= creatorMinResources ||
		e.Moemoepoint >= creatorMinMoemoepoint
	return e, nil
}

// CreatorStatus returns the user's eligibility snapshot + current OAuth
// application (nil if never applied).
func (s *UserService) CreatorStatus(ctx context.Context, userID int, token string) (*CreatorEligibility, *userclient.CreatorApplication, *errors.AppError) {
	e, appErr := s.creatorEligibility(ctx, userID)
	if appErr != nil {
		return nil, nil, appErr
	}
	app, err := s.users.GetMyCreatorApplication(ctx, token)
	if err != nil {
		return nil, nil, errors.ErrInternal("获取申请状态失败")
	}
	return e, app, nil
}

// ApplyCreator enforces moyu's eligibility gate, then files the application on
// the central OAuth queue with evidence. OAuth's own guards (already-creator /
// one-pending / cooldown) surface via the returned message.
func (s *UserService) ApplyCreator(ctx context.Context, userID int, token, message string) (*userclient.CreatorApplication, *errors.AppError) {
	e, appErr := s.creatorEligibility(ctx, userID)
	if appErr != nil {
		return nil, appErr
	}
	if !e.Eligible {
		return nil, errors.ErrBadRequest("尚不满足创作者申请条件")
	}
	evidence, _ := json.Marshal(map[string]any{"merged_prs": e.MergedPRs, "resources": e.Resources, "moemoepoint": e.Moemoepoint})
	app, err := s.users.CreateCreatorApplication(ctx, token, creatorSource, evidence, message)
	if err != nil {
		if ce, ok := err.(*userclient.CreatorAPIError); ok {
			return nil, errors.ErrBadRequest(ce.Message)
		}
		return nil, errors.ErrInternal("提交申请失败")
	}
	return app, nil
}
