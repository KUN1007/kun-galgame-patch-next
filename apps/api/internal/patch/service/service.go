package service

import (
	"context"
	"fmt"
	"regexp"
	"strconv"
	"time"

	"kun-galgame-patch-api/internal/patch/model"
	"kun-galgame-patch-api/internal/patch/repository"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type PatchService struct {
	repo *repository.PatchRepository
	rdb  *redis.Client
	db   *gorm.DB
}

func New(repo *repository.PatchRepository, rdb *redis.Client, db *gorm.DB) *PatchService {
	return &PatchService{repo: repo, rdb: rdb, db: db}
}

// ===== Patch =====

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
	existing.Hash = update.Hash
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
