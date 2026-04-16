package service

import (
	"fmt"
	"math/rand"
	"time"

	authModel "kun-galgame-patch-api/internal/auth/model"
	authService "kun-galgame-patch-api/internal/auth/service"
	"kun-galgame-patch-api/internal/user/dto"
	"kun-galgame-patch-api/internal/user/model"
	"kun-galgame-patch-api/internal/user/repository"

	"gorm.io/gorm"
)

type UserService struct {
	repo    *repository.UserRepository
	authSvc *authService.AuthService
}

func New(repo *repository.UserRepository, authSvc *authService.AuthService) *UserService {
	return &UserService{repo: repo, authSvc: authSvc}
}

// GetUserInfo 获取用户公开信息
func (s *UserService) GetUserInfo(uid, currentUID int) (*dto.UserInfoResponse, error) {
	user, err := s.repo.FindByID(uid)
	if err != nil {
		return nil, fmt.Errorf("用户不存在")
	}

	resp := &dto.UserInfoResponse{
		ID:             user.ID,
		Name:           user.Name,
		Avatar:         user.Avatar,
		Bio:            user.Bio,
		Moemoepoint:    user.Moemoepoint,
		Role:           user.Role,
		FollowerCount:  user.FollowerCount,
		FollowingCount: user.FollowingCount,
		RegisterTime:   user.RegisterTime.Format(time.RFC3339),
		PatchCount:     s.repo.CountUserPatches(uid),
		ResourceCount:  s.repo.CountUserResources(uid),
		CommentCount:   s.repo.CountUserComments(uid),
		FavoriteCount:  s.repo.CountUserFavorites(uid),
	}

	if currentUID > 0 && currentUID != uid {
		_, err := s.repo.FindFollow(currentUID, uid)
		resp.IsFollowed = err == nil
	}

	return resp, nil
}

// GetUserFloating 悬浮卡片信息
func (s *UserService) GetUserFloating(uid int) (*dto.UserInfoResponse, error) {
	return s.GetUserInfo(uid, 0)
}

// UpdateUsername 修改用户名（-30 萌萌点）
func (s *UserService) UpdateUsername(userID int, newName string) error {
	user, err := s.repo.FindByID(userID)
	if err != nil {
		return fmt.Errorf("用户不存在")
	}
	if user.Moemoepoint < 30 {
		return fmt.Errorf("萌萌点不足（需要 30）")
	}

	existing, _ := s.repo.FindByName(newName)
	if existing != nil && existing.ID != userID {
		return fmt.Errorf("用户名已被使用")
	}

	return s.repo.UpdateFields(userID, map[string]any{
		"name":        newName,
		"moemoepoint": gorm.Expr("moemoepoint - 30"),
	})
}

// UpdateBio 修改简介
func (s *UserService) UpdateBio(userID int, bio string) error {
	return s.repo.UpdateFields(userID, map[string]any{"bio": bio})
}

// UpdatePassword 修改密码
func (s *UserService) UpdatePassword(userID int, oldPassword, newPassword string) error {
	user, err := s.repo.FindByID(userID)
	if err != nil {
		return fmt.Errorf("用户不存在")
	}

	if user.Password != "" && !s.authSvc.VerifyPassword(user.Password, oldPassword) {
		return fmt.Errorf("旧密码错误")
	}

	hashed := s.authSvc.HashPassword(newPassword)
	return s.repo.UpdateFields(userID, map[string]any{"password": hashed})
}

// UpdateEmail 修改邮箱
func (s *UserService) UpdateEmail(userID int, email, code string) error {
	if err := s.authSvc.VerifyCode(email, code); err != nil {
		return err
	}
	return s.repo.UpdateFields(userID, map[string]any{"email": email})
}

// Follow 关注用户
func (s *UserService) Follow(followerID, followingID int) error {
	if followerID == followingID {
		return fmt.Errorf("不能关注自己")
	}

	_, err := s.repo.FindFollow(followerID, followingID)
	if err == nil {
		return fmt.Errorf("已经关注了该用户")
	}

	rel := &model.UserFollowRelation{FollowerID: followerID, FollowingID: followingID}
	if err := s.repo.CreateFollow(rel); err != nil {
		return err
	}

	return s.repo.UpdateFollowCounts(followerID, followingID, 1)
}

// Unfollow 取消关注
func (s *UserService) Unfollow(followerID, followingID int) error {
	if err := s.repo.DeleteFollow(followerID, followingID); err != nil {
		return fmt.Errorf("未关注该用户")
	}
	return s.repo.UpdateFollowCounts(followerID, followingID, -1)
}

// GetFollowers 获取粉丝列表
func (s *UserService) GetFollowers(uid, page, limit int) ([]model.UserBasic, int64, error) {
	return s.repo.GetFollowers(uid, (page-1)*limit, limit)
}

// GetFollowing 获取关注列表
func (s *UserService) GetFollowing(uid, page, limit int) ([]model.UserBasic, int64, error) {
	return s.repo.GetFollowing(uid, (page-1)*limit, limit)
}

// CheckIn 每日签到
func (s *UserService) CheckIn(userID int) (int, error) {
	user, err := s.repo.FindByID(userID)
	if err != nil {
		return 0, fmt.Errorf("用户不存在")
	}
	if user.DailyCheckIn == 1 {
		return 0, fmt.Errorf("今日已签到")
	}

	points := rand.Intn(8) // 0-7
	if err := s.repo.CheckIn(userID, points); err != nil {
		return 0, err
	}
	return points, nil
}

// SearchUsers 搜索用户（@提及）
func (s *UserService) SearchUsers(query string) ([]model.UserBasic, error) {
	return s.repo.SearchUsers(query, 50)
}

// GetUserPatches 获取用户的补丁列表
func (s *UserService) GetUserPatches(uid, page, limit int) (any, int64, error) {
	return s.repo.GetUserPatches(uid, (page-1)*limit, limit)
}

// GetUserResources 获取用户的资源列表
func (s *UserService) GetUserResources(uid, page, limit int) (any, int64, error) {
	return s.repo.GetUserResources(uid, (page-1)*limit, limit)
}

// GetUserFavorites 获取用户的收藏列表
func (s *UserService) GetUserFavorites(uid, page, limit int) (any, int64, error) {
	return s.repo.GetUserFavorites(uid, (page-1)*limit, limit)
}

// GetUserComments 获取用户的评论列表
func (s *UserService) GetUserComments(uid, page, limit int) (any, int64, error) {
	return s.repo.GetUserComments(uid, (page-1)*limit, limit)
}

// GetUserContributions 获取用户的贡献列表
func (s *UserService) GetUserContributions(uid, page, limit int) (any, int64, error) {
	return s.repo.GetUserContributions(uid, (page-1)*limit, limit)
}

// UpdateLastLoginTime 更新最后登录时间
func (s *UserService) UpdateLastLoginTime(userID int) {
	s.repo.UpdateFields(userID, map[string]any{
		"last_login_time": time.Now().Format(time.RFC3339),
	})
}

// GetUserByID 获取用户（内部使用）
func (s *UserService) GetUserByID(uid int) (*authModel.User, error) {
	return s.repo.FindByID(uid)
}
