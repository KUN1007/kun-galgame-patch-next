package service

import (
	"context"
	stderrors "errors"
	"log/slog"
	"time"

	"kun-galgame-patch-api/internal/admin/dto"
	adminModel "kun-galgame-patch-api/internal/admin/model"
	"kun-galgame-patch-api/internal/admin/repository"
	"kun-galgame-patch-api/internal/infrastructure/markdown"
	"kun-galgame-patch-api/internal/middleware"
	patchModel "kun-galgame-patch-api/internal/patch/model"
	patchService "kun-galgame-patch-api/internal/patch/service"
	settingService "kun-galgame-patch-api/internal/setting/service"
	"kun-galgame-patch-api/pkg/errors"

	"github.com/redis/go-redis/v9"
)

type AdminService struct {
	repo    *repository.AdminRepository
	rdb     *redis.Client
	setting *settingService.Service
	patch   *patchService.PatchService
}

func New(repo *repository.AdminRepository, rdb *redis.Client, setting *settingService.Service, patch *patchService.PatchService) *AdminService {
	return &AdminService{repo: repo, rdb: rdb, setting: setting, patch: patch}
}

func (s *AdminService) GetComments(search, status string, page, limit int) ([]patchModel.PatchComment, int64, error) {
	comments, total, err := s.repo.GetComments(search, status, (page-1)*limit, limit)
	if err == nil {
		for i := range comments {
			comments[i].ContentHTML = markdown.MustRender(comments[i].Content)
		}
	}
	return comments, total, err
}

func (s *AdminService) UpdateComment(commentID int, content string, adminUID int) error {
	if err := s.repo.UpdateComment(commentID, content); err != nil {
		return err
	}
	s.repo.CreateLog(adminUID, "updateComment", map[string]any{"comment_id": commentID})
	return nil
}

func (s *AdminService) DeleteComment(commentID, adminUID int) error {
	return s.patch.DeleteComment(commentID, adminUID, true, "")
}

func (s *AdminService) GetResources(search string, page, limit int) ([]patchModel.PatchResource, int64, error) {
	resources, total, err := s.repo.GetResources(search, (page-1)*limit, limit)
	if err == nil {
		patchModel.RenderResourceNotes(resources)
	}
	return resources, total, err
}

func (s *AdminService) UpdateResource(resourceID int, note string, adminUID int) error {
	if err := s.repo.UpdateResource(resourceID, note); err != nil {
		return err
	}
	s.repo.CreateLog(adminUID, "updateResource", map[string]any{"resource_id": resourceID})
	return nil
}

func (s *AdminService) DeleteResource(resourceID, adminUID int, reason string) error {
	return s.patch.DeleteResource(resourceID, adminUID, true, reason)
}

func (s *AdminService) PurgeUserPreview(userID int, includeOwnedPatches bool) (*dto.UserPurgePreview, error) {
	c, err := s.repo.PurgePreview(userID, includeOwnedPatches)
	if err != nil {
		return nil, err
	}
	return &dto.UserPurgePreview{
		UserID:              userID,
		UserExists:          c.UserExists,
		Comments:            c.Comments,
		Resources:           c.Resources,
		CommentLikes:        c.CommentLikes,
		ResourceLikes:       c.ResourceLikes,
		Contributes:         c.Contributes,
		Following:           c.Following,
		Followers:           c.Followers,
		ChatMemberships:     c.ChatMemberships,
		ChatMessages:        c.ChatMessages,
		PrivateMessages:     c.PrivateMessages,
		OwnedPatches:        c.OwnedPatches,
		OwnedPatchResources: c.OwnedPatchResources,
		OwnedPatchComments:  c.OwnedPatchComments,
		MiscTraces:          c.MiscTraces,
		CanDeleteUserRow:    c.OwnedPatches == 0 || includeOwnedPatches,
	}, nil
}

func (s *AdminService) PurgeUser(userID int, purgeOwnedPatches bool, adminUID int) (*dto.UserPurgeResult, error) {
	uuids, uErr := s.repo.CollectUserArtifactUUIDs(userID, purgeOwnedPatches)
	if uErr != nil {
		slog.Warn("PurgeUser: failed to enumerate artifact_uuids for cleanup", "user_id", userID, "error", uErr)
		uuids = nil
	}

	if err := s.repo.PurgeUser(userID, purgeOwnedPatches); err != nil {
		if stderrors.Is(err, repository.ErrUserOwnsPatches) {
			return nil, errors.ErrBadRequest("该用户仍拥有补丁，必须勾选「强删该用户创建的补丁」才能删除其账号")
		}
		return nil, errors.ErrInternal("")
	}

	if len(uuids) > 0 {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()
		s.patch.SoftDeleteArtifacts(ctx, uuids)
	}

	res := &dto.UserPurgeResult{UserID: userID, UserRowDeleted: true}

	if s.rdb != nil {
		if n, rerr := middleware.RevokeUserSessions(context.Background(), s.rdb, userID); rerr != nil {
			slog.Warn("PurgeUser: 撤销会话失败", "user_id", userID, "error", rerr)
		} else {
			res.SessionsRevoked = n
		}
	}

	s.repo.CreateLog(adminUID, "purgeUser", map[string]any{
		"target_user_id":      userID,
		"purge_owned_patches": purgeOwnedPatches,
		"sessions_revoked":    res.SessionsRevoked,
	})
	return res, nil
}

func (s *AdminService) GetAllPatches(search string, page, limit int) ([]patchModel.Patch, int64, error) {
	return s.repo.GetAllPatches(search, (page-1)*limit, limit)
}

func (s *AdminService) LookupPatchesByIDs(ids []int) ([]patchModel.Patch, error) {
	return s.repo.LookupPatchesByIDs(ids)
}

func (s *AdminService) GetSetting(key string) bool {
	return s.setting.GetBool(key)
}

func (s *AdminService) SetSetting(key string, enabled bool, adminUID int) error {
	return s.setting.SetBool(key, enabled, adminUID)
}

func (s *AdminService) GetStats(days int) *dto.AdminStatsResponse {
	since := time.Now().AddDate(0, 0, -days)
	newUser, newActive, newGalgame, newResource, newComment := s.repo.GetStats(since)
	return &dto.AdminStatsResponse{
		NewUser:          newUser,
		NewActiveUser:    newActive,
		NewGalgame:       newGalgame,
		NewPatchResource: newResource,
		NewComment:       newComment,
	}
}

func (s *AdminService) GetStatsSum() *dto.AdminStatsSumResponse {
	u, g, r, c := s.repo.GetStatsSum()
	return &dto.AdminStatsSumResponse{
		UserCount:          u,
		GalgameCount:       g,
		PatchResourceCount: r,
		PatchCommentCount:  c,
	}
}

func (s *AdminService) GetLogs(page, limit int) ([]adminModel.AdminLog, int64, error) {
	return s.repo.GetLogs((page-1)*limit, limit)
}

func (s *AdminService) GetResourceFileHistory(
	resourceID, page, limit int,
) ([]patchModel.PatchResourceFileHistory, int64, error) {
	return s.repo.GetResourceFileHistory(resourceID, (page-1)*limit, limit)
}

func (s *AdminService) GetOrphanCandidateIDs() ([]int, error) {
	return s.repo.GetOrphanCandidateIDs()
}

func (s *AdminService) GetOrphanPatches(page, limit int, excludeIDs []int) ([]patchModel.Patch, int64, error) {
	return s.repo.GetOrphanPatches((page-1)*limit, limit, excludeIDs)
}

func (s *AdminService) CountOrphanPatches(excludeIDs []int) (pending, badVndb int64, err error) {
	return s.repo.CountOrphanPatches(excludeIDs)
}
