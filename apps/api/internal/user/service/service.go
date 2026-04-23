package service

import (
	"bytes"
	"context"
	"fmt"
	"math/rand"
	"time"

	authModel "kun-galgame-patch-api/internal/auth/model"
	authService "kun-galgame-patch-api/internal/auth/service"
	"kun-galgame-patch-api/internal/infrastructure/storage"
	patchModel "kun-galgame-patch-api/internal/patch/model"
	"kun-galgame-patch-api/internal/user/dto"
	"kun-galgame-patch-api/internal/user/model"
	"kun-galgame-patch-api/internal/user/repository"
	"kun-galgame-patch-api/pkg/imageutil"

	"gorm.io/gorm"
)

// 每日个人图片上传限额，对齐 apps/next-web/config/user.ts 的 KUN_PATCH_USER_DAILY_UPLOAD_IMAGE_LIMIT。
const DailyImageLimit = 20

type UserService struct {
	repo    *repository.UserRepository
	authSvc *authService.AuthService
	s3      *storage.S3Client
}

func New(repo *repository.UserRepository, authSvc *authService.AuthService, s3 *storage.S3Client) *UserService {
	return &UserService{repo: repo, authSvc: authSvc, s3: s3}
}

// GetUserInfo retrieves public user info
func (s *UserService) GetUserInfo(uid, currentUID int) (*dto.UserInfoResponse, error) {
	user, err := s.repo.FindByID(uid)
	if err != nil {
		return nil, fmt.Errorf("user not found")
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

// GetUserFloating retrieves floating card info
func (s *UserService) GetUserFloating(uid int) (*dto.UserInfoResponse, error) {
	return s.GetUserInfo(uid, 0)
}

// UpdateUsername changes the username (costs 30 moemoepoints)
func (s *UserService) UpdateUsername(userID int, newName string) error {
	user, err := s.repo.FindByID(userID)
	if err != nil {
		return fmt.Errorf("user not found")
	}
	if user.Moemoepoint < 30 {
		return fmt.Errorf("insufficient moemoepoints (30 required)")
	}

	existing, _ := s.repo.FindByName(newName)
	if existing != nil && existing.ID != userID {
		return fmt.Errorf("username is already taken")
	}

	return s.repo.UpdateFields(userID, map[string]any{
		"name":        newName,
		"moemoepoint": gorm.Expr("moemoepoint - 30"),
	})
}

// UpdateBio updates the user bio
func (s *UserService) UpdateBio(userID int, bio string) error {
	return s.repo.UpdateFields(userID, map[string]any{"bio": bio})
}

// UpdatePassword changes the user password
func (s *UserService) UpdatePassword(userID int, oldPassword, newPassword string) error {
	user, err := s.repo.FindByID(userID)
	if err != nil {
		return fmt.Errorf("user not found")
	}

	if user.Password != "" && !s.authSvc.VerifyPassword(user.Password, oldPassword) {
		return fmt.Errorf("incorrect old password")
	}

	hashed := s.authSvc.HashPassword(newPassword)
	return s.repo.UpdateFields(userID, map[string]any{"password": hashed})
}

// UpdateEmail changes the user email
func (s *UserService) UpdateEmail(userID int, email, code string) error {
	if err := s.authSvc.VerifyCode(email, code); err != nil {
		return err
	}
	return s.repo.UpdateFields(userID, map[string]any{"email": email})
}

// Follow follows a user
func (s *UserService) Follow(followerID, followingID int) error {
	if followerID == followingID {
		return fmt.Errorf("cannot follow yourself")
	}

	_, err := s.repo.FindFollow(followerID, followingID)
	if err == nil {
		return fmt.Errorf("already following this user")
	}

	rel := &model.UserFollowRelation{FollowerID: followerID, FollowingID: followingID}
	if err := s.repo.CreateFollow(rel); err != nil {
		return err
	}

	return s.repo.UpdateFollowCounts(followerID, followingID, 1)
}

// Unfollow unfollows a user
func (s *UserService) Unfollow(followerID, followingID int) error {
	if err := s.repo.DeleteFollow(followerID, followingID); err != nil {
		return fmt.Errorf("not following this user")
	}
	return s.repo.UpdateFollowCounts(followerID, followingID, -1)
}

// GetFollowers retrieves the followers list
func (s *UserService) GetFollowers(uid, page, limit int) ([]model.UserBasic, int64, error) {
	return s.repo.GetFollowers(uid, (page-1)*limit, limit)
}

// GetFollowing retrieves the following list
func (s *UserService) GetFollowing(uid, page, limit int) ([]model.UserBasic, int64, error) {
	return s.repo.GetFollowing(uid, (page-1)*limit, limit)
}

// CheckIn performs daily check-in
func (s *UserService) CheckIn(userID int) (int, error) {
	user, err := s.repo.FindByID(userID)
	if err != nil {
		return 0, fmt.Errorf("user not found")
	}
	if user.DailyCheckIn == 1 {
		return 0, fmt.Errorf("already checked in today")
	}

	points := rand.Intn(8) // 0-7
	if err := s.repo.CheckIn(userID, points); err != nil {
		return 0, err
	}
	return points, nil
}

// SearchUsers searches users (for @mentions)
func (s *UserService) SearchUsers(query string) ([]model.UserBasic, error) {
	return s.repo.SearchUsers(query, 50)
}

// GetUserPatches retrieves the user's patch list
func (s *UserService) GetUserPatches(uid, page, limit int) ([]patchModel.Patch, int64, error) {
	return s.repo.GetUserPatches(uid, (page-1)*limit, limit)
}

// GetUserResources retrieves the user's resource list
func (s *UserService) GetUserResources(uid, page, limit int) (any, int64, error) {
	return s.repo.GetUserResources(uid, (page-1)*limit, limit)
}

// GetUserFavorites retrieves the user's favorite list
func (s *UserService) GetUserFavorites(uid, page, limit int) ([]patchModel.Patch, int64, error) {
	return s.repo.GetUserFavorites(uid, (page-1)*limit, limit)
}

// GetUserComments retrieves the user's comment list
func (s *UserService) GetUserComments(uid, page, limit int) (any, int64, error) {
	return s.repo.GetUserComments(uid, (page-1)*limit, limit)
}

// GetUserContributions retrieves the user's contribution list
func (s *UserService) GetUserContributions(uid, page, limit int) ([]patchModel.Patch, int64, error) {
	return s.repo.GetUserContributions(uid, (page-1)*limit, limit)
}

// UpdateLastLoginTime updates the last login time
func (s *UserService) UpdateLastLoginTime(userID int) {
	s.repo.UpdateFields(userID, map[string]any{
		"last_login_time": time.Now().Format(time.RFC3339),
	})
}

// GetUserByID retrieves a user (for internal use)
func (s *UserService) GetUserByID(uid int) (*authModel.User, error) {
	return s.repo.FindByID(uid)
}

// ─── 头像与配图上传 ──────────────────────────────────

// UpdateAvatar 上传并设置用户头像（256x256 + 100x100 两张 JPEG）。
func (s *UserService) UpdateAvatar(ctx context.Context, uid int, raw []byte) (string, error) {
	full, err := imageutil.FitJPEG(raw, 256, 256, 85)
	if err != nil {
		return "", err
	}
	mini, err := imageutil.FitJPEG(raw, 100, 100, 85)
	if err != nil {
		return "", err
	}

	prefix := fmt.Sprintf("user/avatar/user_%d", uid)
	avatarKey := prefix + "/avatar.jpg"
	miniKey := prefix + "/avatar-mini.jpg"

	if err := s.s3.PutObject(ctx, avatarKey, bytes.NewReader(full), int64(len(full)), "image/jpeg"); err != nil {
		return "", err
	}
	if err := s.s3.PutObject(ctx, miniKey, bytes.NewReader(mini), int64(len(mini)), "image/jpeg"); err != nil {
		return "", err
	}

	avatarURL := s.s3.PublicURL(avatarKey)
	if err := s.repo.UpdateFields(uid, map[string]any{"avatar": avatarURL}); err != nil {
		return "", err
	}
	return avatarURL, nil
}

// UploadUserImage 上传用户个人页配图（1920x1080 内，JPEG q=50）。
// 受 daily_image_count 限制（对齐原项目 DailyImageLimit）。
func (s *UserService) UploadUserImage(ctx context.Context, uid int, raw []byte) (string, error) {
	user, err := s.repo.FindByID(uid)
	if err != nil {
		return "", fmt.Errorf("用户不存在")
	}
	if user.DailyImageCount >= DailyImageLimit {
		return "", fmt.Errorf("今日上传图片数量已达 %d 张上限", DailyImageLimit)
	}

	jpg, err := imageutil.FitJPEG(raw, 1920, 1080, 50)
	if err != nil {
		return "", err
	}

	key := fmt.Sprintf("user_%d/image/%d-%d.jpg", uid, uid, time.Now().UnixMilli())
	if err := s.s3.PutObject(ctx, key, bytes.NewReader(jpg), int64(len(jpg)), "image/jpeg"); err != nil {
		return "", err
	}

	// 扣 daily_image_count
	if err := s.repo.UpdateFields(uid, map[string]any{
		"daily_image_count": gorm.Expr("daily_image_count + 1"),
	}); err != nil {
		return "", err
	}
	return s.s3.PublicURL(key), nil
}
