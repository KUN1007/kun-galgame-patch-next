package service

import (
	"context"
	"encoding/json"
	"log/slog"

	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/userclient"
)

const (
	creatorMinMergedPRs   = 5
	creatorMinResources   = 3
	creatorMinMoemoepoint = 2000
	creatorSource         = "moyu"
)

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
