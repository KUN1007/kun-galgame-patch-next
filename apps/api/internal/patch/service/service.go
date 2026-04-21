package service

import (
	"bytes"
	"context"
	"fmt"
	"image"
	_ "image/gif"  // GIF decoder
	"image/jpeg"
	_ "image/png" // PNG decoder
	"regexp"
	"strconv"
	"time"

	"kun-galgame-patch-api/internal/infrastructure/storage"
	"kun-galgame-patch-api/internal/patch/model"
	"kun-galgame-patch-api/internal/patch/repository"

	"github.com/disintegration/imaging"
	_ "golang.org/x/image/webp" // WebP decoder
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type PatchService struct {
	repo *repository.PatchRepository
	rdb  *redis.Client
	db   *gorm.DB
	s3   *storage.S3Client
}

func New(repo *repository.PatchRepository, rdb *redis.Client, db *gorm.DB, s3 *storage.S3Client) *PatchService {
	return &PatchService{repo: repo, rdb: rdb, db: db, s3: s3}
}

// ===== Patch =====

// CreatePatch 处理 POST /api/patch。步骤：
//  1. 事务内插入 patch 行（banner 先空字符串）
//  2. 服务端 resize + JPEG 编码 banner，PutObject 到 S3
//  3. 回填 patch.banner URL
//  4. 批量写入 patch_alias
//  5. 用户 +3 moemoepoint, +1 daily_image_count
//  6. 登记 contributor 关系（contribute_count 自增在 EnsureContributor 里做）
func (s *PatchService) CreatePatch(
	ctx context.Context,
	uid int,
	req CreatePatchInput,
	bannerBytes []byte,
) (int, error) {
	// 1. VNDB 重复检查
	if req.VndbID != "" {
		if existing, _ := s.repo.FindPatchByVndbID(req.VndbID); existing != nil && existing.ID != 0 {
			return 0, fmt.Errorf("该 VNDB ID 已经存在对应的补丁")
		}
	}

	// 2. 预解码 + 预压缩 banner（事务外做，节省事务时间）
	bannerJPEG, err := processBanner(bannerBytes)
	if err != nil {
		return 0, err
	}

	var patchID int
	err = s.db.Transaction(func(tx *gorm.DB) error {
		// 2a. 创建 patch
		p := &model.Patch{
			NameZhCn:         req.NameZhCn,
			NameJaJp:         req.NameJaJp,
			NameEnUs:         req.NameEnUs,
			IntroductionZhCn: req.IntroductionZhCn,
			IntroductionJaJp: req.IntroductionJaJp,
			IntroductionEnUs: req.IntroductionEnUs,
			UserID:           uid,
			Banner:           "",
			Released:         defaultString(req.Released, "unknown"),
			ContentLimit:     req.ContentLimit,
		}
		if req.VndbID != "" {
			p.VndbID = &req.VndbID
		}
		if err := tx.Create(p).Error; err != nil {
			return fmt.Errorf("创建 patch 失败: %w", err)
		}
		patchID = p.ID

		// 2b. 上传 banner（事务内 S3 调用：失败即回滚 DB）
		bannerKey := fmt.Sprintf("patch/%d/banner/banner.jpg", p.ID)
		if err := s.s3.PutObject(ctx, bannerKey, bytes.NewReader(bannerJPEG), int64(len(bannerJPEG)), "image/jpeg"); err != nil {
			return fmt.Errorf("上传 banner 失败: %w", err)
		}
		p.Banner = s.s3.PublicURL(bannerKey)

		// 2c. 回填 banner URL
		if err := tx.Model(p).UpdateColumn("banner", p.Banner).Error; err != nil {
			return fmt.Errorf("回填 banner URL 失败: %w", err)
		}

		// 2d. 批量写 alias
		if len(req.Alias) > 0 {
			aliases := make([]model.PatchAlias, 0, len(req.Alias))
			for _, name := range req.Alias {
				aliases = append(aliases, model.PatchAlias{PatchID: p.ID, Name: name})
			}
			if err := tx.Create(&aliases).Error; err != nil {
				return fmt.Errorf("写入 alias 失败: %w", err)
			}
		}

		// 2e. 用户激励
		if err := tx.Table("user").Where("id = ?", uid).Updates(map[string]any{
			"moemoepoint":       gorm.Expr("moemoepoint + 3"),
			"daily_image_count": gorm.Expr("daily_image_count + 1"),
		}).Error; err != nil {
			return fmt.Errorf("更新用户积分失败: %w", err)
		}

		// 2f. 登记 contributor
		if err := tx.Create(&model.UserPatchContributeRelation{
			UserID: uid, PatchID: p.ID,
		}).Error; err != nil {
			return fmt.Errorf("登记 contributor 失败: %w", err)
		}
		if err := tx.Model(&model.Patch{}).Where("id = ?", p.ID).
			UpdateColumn("contribute_count", gorm.Expr("contribute_count + 1")).Error; err != nil {
			return fmt.Errorf("更新 contribute_count 失败: %w", err)
		}
		return nil
	})
	if err != nil {
		// 事务失败：尽力清理 banner（可能没上传）
		if patchID > 0 {
			_ = s.s3.DeleteObject(ctx, fmt.Sprintf("patch/%d/banner/banner.jpg", patchID))
		}
		return 0, err
	}

	return patchID, nil
}

// CreatePatchInput 给 handler 用的输入结构（避免 handler 直接依赖 dto 包绕）。
type CreatePatchInput struct {
	VndbID           string
	NameZhCn         string
	NameJaJp         string
	NameEnUs         string
	IntroductionZhCn string
	IntroductionJaJp string
	IntroductionEnUs string
	Alias            []string
	Released         string
	ContentLimit     string
}

// processBanner 解码任意常见图片格式，Fit 到 1920x1080 以内，按 JPEG quality=85 输出。
func processBanner(raw []byte) ([]byte, error) {
	img, _, err := image.Decode(bytes.NewReader(raw))
	if err != nil {
		return nil, fmt.Errorf("解码图片失败: %w", err)
	}

	// 按 fit-inside 策略缩放（不放大）
	resized := imaging.Fit(img, 1920, 1080, imaging.Lanczos)

	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, resized, &jpeg.Options{Quality: 85}); err != nil {
		return nil, fmt.Errorf("编码 JPEG 失败: %w", err)
	}
	return buf.Bytes(), nil
}

func defaultString(v, fallback string) string {
	if v == "" {
		return fallback
	}
	return v
}

// UpdateBanner 替换补丁 banner 图片。仅补丁创建者或 role >= 3 可操作。
func (s *PatchService) UpdateBanner(ctx context.Context, patchID, uid, role int, bannerBytes []byte) (string, error) {
	p, err := s.repo.GetPatchByID(patchID)
	if err != nil {
		return "", fmt.Errorf("补丁不存在")
	}
	if p.UserID != uid && role < 3 {
		return "", fmt.Errorf("仅补丁发布者或管理员可更换 banner")
	}

	jpegBytes, err := processBanner(bannerBytes)
	if err != nil {
		return "", err
	}

	key := fmt.Sprintf("patch/%d/banner/banner.jpg", patchID)
	if err := s.s3.PutObject(ctx, key, bytes.NewReader(jpegBytes), int64(len(jpegBytes)), "image/jpeg"); err != nil {
		return "", err
	}
	bannerURL := s.s3.PublicURL(key)
	if err := s.db.Model(&model.Patch{}).Where("id = ?", patchID).
		UpdateColumn("banner", bannerURL).Error; err != nil {
		return "", err
	}
	return bannerURL, nil
}

func (s *PatchService) GetPatch(id int) (*model.Patch, error) {
	return s.repo.GetPatchByID(id)
}

func (s *PatchService) GetPatchDetail(id int) (*model.Patch, error) {
	return s.repo.GetPatchDetail(id)
}

func (s *PatchService) UpdatePatch(id, userID, userRole int, update *model.Patch, aliases []string) error {
	existing, err := s.repo.GetPatchByID(id)
	if err != nil {
		return fmt.Errorf("patch not found")
	}
	if existing.UserID != userID && userRole < 3 {
		return fmt.Errorf("no permission to modify this patch")
	}

	existing.NameZhCn = update.NameZhCn
	existing.NameJaJp = update.NameJaJp
	existing.NameEnUs = update.NameEnUs
	existing.IntroductionZhCn = update.IntroductionZhCn
	existing.IntroductionJaJp = update.IntroductionJaJp
	existing.IntroductionEnUs = update.IntroductionEnUs
	existing.Released = update.Released
	existing.ContentLimit = update.ContentLimit
	if update.VndbID != nil {
		existing.VndbID = update.VndbID
	}

	if err := s.repo.UpdatePatch(existing); err != nil {
		return err
	}

	return s.repo.ReplaceAliases(id, aliases)
}

func (s *PatchService) DeletePatch(id, userID, userRole int) error {
	patch, err := s.repo.GetPatchByID(id)
	if err != nil {
		return fmt.Errorf("patch not found")
	}
	if patch.UserID != userID && userRole < 4 {
		return fmt.Errorf("no permission to delete this patch")
	}
	return s.repo.DeletePatch(id)
}

func (s *PatchService) CheckDuplicate(vndbID string) (bool, error) {
	_, err := s.repo.FindPatchByVndbID(vndbID)
	if err == gorm.ErrRecordNotFound {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func (s *PatchService) IncrementView(id int) error {
	return s.repo.IncrementView(id)
}

func (s *PatchService) GetRandomPatchID() (int, error) {
	return s.repo.GetRandomPatchID()
}

// ===== Comments =====

func (s *PatchService) GetComments(patchID, page, limit int) ([]model.PatchComment, int64, error) {
	offset := (page - 1) * limit
	return s.repo.GetComments(patchID, offset, limit)
}

func (s *PatchService) CreateComment(patchID, userID int, content string, parentID *int) (*model.PatchComment, error) {
	comment := &model.PatchComment{
		PatchID:  patchID,
		UserID:   userID,
		Content:  content,
		ParentID: parentID,
	}
	if err := s.repo.CreateComment(comment); err != nil {
		return nil, err
	}

	// Update patch comment count
	s.repo.UpdateCount(patchID, "comment_count", 1)

	// Award moemoepoint to patch creator
	patch, _ := s.repo.GetPatchByID(patchID)
	if patch != nil && patch.UserID != userID {
		s.repo.UpdateMoemoepoint(patch.UserID, 1)
	}

	// Ensure contributor
	s.repo.EnsureContributor(userID, patchID)

	return comment, nil
}

func (s *PatchService) UpdateComment(commentID, userID int, content string) error {
	comment, err := s.repo.GetCommentByID(commentID)
	if err != nil {
		return fmt.Errorf("comment not found")
	}
	if comment.UserID != userID {
		return fmt.Errorf("can only edit your own comments")
	}
	comment.Content = content
	comment.Edit = time.Now().Format(time.RFC3339)
	return s.repo.UpdateComment(comment)
}

func (s *PatchService) DeleteComment(commentID, userID, userRole int) error {
	comment, err := s.repo.GetCommentByID(commentID)
	if err != nil {
		return fmt.Errorf("comment not found")
	}
	if comment.UserID != userID && userRole < 3 {
		return fmt.Errorf("no permission to delete this comment")
	}

	count, _ := s.repo.CountCommentAndReplies(commentID)
	if err := s.repo.DeleteComment(commentID); err != nil {
		return err
	}
	s.repo.UpdateCount(comment.PatchID, "comment_count", -int(count))
	return nil
}

func (s *PatchService) ToggleCommentLike(commentID, userID int) (bool, error) {
	comment, err := s.repo.GetCommentByID(commentID)
	if err != nil {
		return false, fmt.Errorf("comment not found")
	}

	existing, err := s.repo.FindCommentLike(userID, commentID)
	if err == nil {
		// Unlike
		s.repo.DeleteCommentLike(existing.ID)
		s.db.Model(&model.PatchComment{}).Where("id = ?", commentID).
			UpdateColumn("like_count", gorm.Expr("GREATEST(like_count - 1, 0)"))
		if comment.UserID != userID {
			s.repo.UpdateMoemoepoint(comment.UserID, -1)
		}
		return false, nil
	}

	// Like
	rel := &model.UserPatchCommentLikeRelation{UserID: userID, CommentID: commentID}
	s.repo.CreateCommentLike(rel)
	s.db.Model(&model.PatchComment{}).Where("id = ?", commentID).
		UpdateColumn("like_count", gorm.Expr("like_count + 1"))
	if comment.UserID != userID {
		s.repo.UpdateMoemoepoint(comment.UserID, 1)
	}
	return true, nil
}

func (s *PatchService) GetCommentMarkdown(commentID int) (string, error) {
	return s.repo.GetCommentMarkdown(commentID)
}

// ===== Resources =====

func (s *PatchService) GetResources(patchID int) ([]model.PatchResource, error) {
	return s.repo.GetResources(patchID)
}

func (s *PatchService) CreateResource(resource *model.PatchResource, userID int) error {
	resource.UserID = userID

	if err := s.repo.CreateResource(resource); err != nil {
		return err
	}

	// Update aggregates
	s.repo.UpdateCount(resource.PatchID, "resource_count", 1)
	s.repo.RecalculatePatchAggregates(resource.PatchID)

	// Update resource_update_time
	s.db.Model(&model.Patch{}).Where("id = ?", resource.PatchID).
		Update("resource_update_time", time.Now())

	// Moemoepoint +3
	s.repo.UpdateMoemoepoint(userID, 3)

	// Ensure contributor
	s.repo.EnsureContributor(userID, resource.PatchID)

	// Notify favorited users
	s.notifyFavoritedUsers(resource.PatchID, userID)

	return nil
}

func (s *PatchService) UpdateResource(resourceID, userID int, update *model.PatchResource) error {
	existing, err := s.repo.GetResourceByID(resourceID)
	if err != nil {
		return fmt.Errorf("resource not found")
	}
	if existing.UserID != userID {
		return fmt.Errorf("can only edit your own resources")
	}

	existing.Storage = update.Storage
	existing.Name = update.Name
	existing.ModelName = update.ModelName
	existing.Size = update.Size
	existing.Code = update.Code
	existing.Password = update.Password
	existing.Note = update.Note
	existing.S3Key = update.S3Key
	existing.Content = update.Content
	existing.Type = update.Type
	existing.Language = update.Language
	existing.Platform = update.Platform
	existing.UpdateTime = time.Now()

	if err := s.repo.UpdateResource(existing); err != nil {
		return err
	}

	s.repo.RecalculatePatchAggregates(existing.PatchID)
	return nil
}

func (s *PatchService) DeleteResource(resourceID, userID int) error {
	resource, err := s.repo.GetResourceByID(resourceID)
	if err != nil {
		return fmt.Errorf("resource not found")
	}
	if resource.UserID != userID {
		return fmt.Errorf("can only delete your own resources")
	}

	if err := s.repo.DeleteResource(resourceID); err != nil {
		return err
	}

	s.repo.UpdateCount(resource.PatchID, "resource_count", -1)
	s.repo.RecalculatePatchAggregates(resource.PatchID)
	s.repo.UpdateMoemoepoint(userID, -3)
	return nil
}

func (s *PatchService) ToggleResourceDisable(resourceID, userID, userRole int) error {
	resource, err := s.repo.GetResourceByID(resourceID)
	if err != nil {
		return fmt.Errorf("resource not found")
	}
	if resource.UserID != userID && userRole < 3 {
		return fmt.Errorf("no permission to operate on this resource")
	}
	return s.repo.ToggleResourceStatus(resourceID)
}

func (s *PatchService) IncrementResourceDownload(resourceID int) error {
	resource, err := s.repo.GetResourceByID(resourceID)
	if err != nil {
		return fmt.Errorf("resource not found")
	}
	return s.repo.IncrementResourceDownload(resourceID, resource.PatchID)
}

func (s *PatchService) ToggleResourceLike(resourceID, userID int) (bool, error) {
	resource, err := s.repo.GetResourceByID(resourceID)
	if err != nil {
		return false, fmt.Errorf("resource not found")
	}

	existing, err := s.repo.FindResourceLike(userID, resourceID)
	if err == nil {
		s.repo.DeleteResourceLike(existing.ID)
		s.db.Model(&model.PatchResource{}).Where("id = ?", resourceID).
			UpdateColumn("like_count", gorm.Expr("GREATEST(like_count - 1, 0)"))
		if resource.UserID != userID {
			s.repo.UpdateMoemoepoint(resource.UserID, -1)
		}
		return false, nil
	}

	rel := &model.UserPatchResourceLikeRelation{UserID: userID, ResourceID: resourceID}
	s.repo.CreateResourceLike(rel)
	s.db.Model(&model.PatchResource{}).Where("id = ?", resourceID).
		UpdateColumn("like_count", gorm.Expr("like_count + 1"))
	if resource.UserID != userID {
		s.repo.UpdateMoemoepoint(resource.UserID, 1)
	}
	return true, nil
}

// ===== Favorites =====

func (s *PatchService) ToggleFavorite(patchID, userID int) (bool, error) {
	patch, err := s.repo.GetPatchByID(patchID)
	if err != nil {
		return false, fmt.Errorf("patch not found")
	}

	existing, err := s.repo.FindFavorite(userID, patchID)
	if err == nil {
		s.repo.DeleteFavorite(existing.ID)
		s.repo.UpdateCount(patchID, "favorite_count", -1)
		if patch.UserID != userID {
			s.repo.UpdateMoemoepoint(patch.UserID, -1)
		}
		return false, nil
	}

	rel := &model.UserPatchFavoriteRelation{UserID: userID, PatchID: patchID}
	s.repo.CreateFavorite(rel)
	s.repo.UpdateCount(patchID, "favorite_count", 1)
	if patch.UserID != userID {
		s.repo.UpdateMoemoepoint(patch.UserID, 1)
	}
	return true, nil
}

func (s *PatchService) IsFavorited(userID, patchID int) bool {
	_, err := s.repo.FindFavorite(userID, patchID)
	return err == nil
}

// ===== Contributors =====

func (s *PatchService) GetContributors(patchID int) ([]model.PatchUser, error) {
	return s.repo.GetContributors(patchID)
}

// ===== Mention detection =====

var mentionRegex = regexp.MustCompile(`\[@[^\]]+\]\(/user/(\d+)/resource\)`)

func (s *PatchService) ExtractMentionUserIDs(content string) []int {
	matches := mentionRegex.FindAllStringSubmatch(content, -1)
	var ids []int
	seen := make(map[int]bool)
	for _, match := range matches {
		if len(match) > 1 {
			if id, err := strconv.Atoi(match[1]); err == nil && !seen[id] {
				ids = append(ids, id)
				seen[id] = true
			}
		}
	}
	return ids
}

// ===== Notifications (simplified) =====

func (s *PatchService) notifyFavoritedUsers(patchID, senderID int) {
	var userIDs []int
	s.db.Model(&model.UserPatchFavoriteRelation{}).
		Where("patch_id = ? AND user_id != ?", patchID, senderID).
		Pluck("user_id", &userIDs)

	for _, uid := range userIDs {
		s.createDedupMessage(senderID, uid, "patchResourceCreate",
			"New resource added to patch",
			fmt.Sprintf("/patch/%d/resource", patchID))
	}
}

func (s *PatchService) createDedupMessage(senderID, recipientID int, msgType, content, link string) {
	var count int64
	s.db.Table("user_message").Where(
		"type = ? AND sender_id = ? AND recipient_id = ? AND link = ?",
		msgType, senderID, recipientID, link,
	).Count(&count)

	if count == 0 {
		s.db.Table("user_message").Create(map[string]any{
			"type":         msgType,
			"content":      content,
			"status":       0,
			"link":         link,
			"sender_id":    senderID,
			"recipient_id": recipientID,
			"created":      time.Now(),
			"updated":      time.Now(),
		})
	}
}

func (s *PatchService) CreateMentionMessages(senderID, patchID int, content string) {
	ids := s.ExtractMentionUserIDs(content)
	excerpt := content
	if len(excerpt) > 233 {
		excerpt = excerpt[:233]
	}
	for _, uid := range ids {
		if uid != senderID {
			s.createDedupMessage(senderID, uid, "mention", excerpt,
				fmt.Sprintf("/patch/%d", patchID))
		}
	}
}

func (s *PatchService) CreateCommentNotification(senderID int, comment *model.PatchComment) {
	if comment.ParentID != nil {
		parent, err := s.repo.GetCommentByID(*comment.ParentID)
		if err == nil && parent.UserID != senderID {
			s.createDedupMessage(senderID, parent.UserID, "comment",
				"Replied to your comment",
				fmt.Sprintf("/patch/%d", comment.PatchID))
		}
	}
}

func (s *PatchService) CreateLikeCommentNotification(senderID int, comment *model.PatchComment) {
	if comment.UserID != senderID {
		s.createDedupMessage(senderID, comment.UserID, "likeComment",
			"Liked your comment",
			fmt.Sprintf("/patch/%d", comment.PatchID))
	}
}

// ===== Admin Settings Check =====

func (s *PatchService) IsCommentVerifyEnabled() bool {
	val, err := s.rdb.Get(context.Background(), "admin:enable_comment_verify").Result()
	return err == nil && val == "true"
}

func (s *PatchService) IsCreatorOnlyEnabled() bool {
	val, err := s.rdb.Get(context.Background(), "admin:enable_only_creator_create").Result()
	return err == nil && val == "true"
}
