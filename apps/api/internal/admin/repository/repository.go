package repository

import (
	"encoding/json"
	"time"

	adminModel "kun-galgame-patch-api/internal/admin/model"
	authModel "kun-galgame-patch-api/internal/auth/model"
	patchModel "kun-galgame-patch-api/internal/patch/model"
	userModel "kun-galgame-patch-api/internal/user/model"

	"gorm.io/gorm"
)

type AdminRepository struct {
	db *gorm.DB
}

func New(db *gorm.DB) *AdminRepository {
	return &AdminRepository{db: db}
}

// ===== Comments =====

func (r *AdminRepository) GetComments(search string, offset, limit int) ([]patchModel.PatchComment, int64, error) {
	var comments []patchModel.PatchComment
	var total int64

	query := r.db.Model(&patchModel.PatchComment{})
	if search != "" {
		query = query.Where("content ILIKE ?", "%"+search+"%")
	}
	query.Count(&total)

	err := query.Order("created DESC").Offset(offset).Limit(limit).
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name", "avatar")
		}).Find(&comments).Error
	return comments, total, err
}

func (r *AdminRepository) UpdateComment(commentID int, content string) error {
	return r.db.Model(&patchModel.PatchComment{}).Where("id = ?", commentID).
		Update("content", content).Error
}

func (r *AdminRepository) DeleteComment(commentID int) error {
	return r.db.Delete(&patchModel.PatchComment{}, commentID).Error
}

// ===== Resources =====

func (r *AdminRepository) GetResources(search string, offset, limit int) ([]patchModel.PatchResource, int64, error) {
	var resources []patchModel.PatchResource
	var total int64

	query := r.db.Model(&patchModel.PatchResource{})
	if search != "" {
		query = query.Where("name ILIKE ? OR content ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	query.Count(&total)

	err := query.Order("created DESC").Offset(offset).Limit(limit).
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name", "avatar")
		}).Find(&resources).Error
	return resources, total, err
}

func (r *AdminRepository) UpdateResource(resourceID int, note string) error {
	return r.db.Model(&patchModel.PatchResource{}).Where("id = ?", resourceID).
		Update("note", note).Error
}

func (r *AdminRepository) DeleteResource(resourceID int) error {
	return r.db.Delete(&patchModel.PatchResource{}, resourceID).Error
}

// ===== Users =====

func (r *AdminRepository) GetUsers(search string, offset, limit int) ([]authModel.User, int64, error) {
	var users []authModel.User
	var total int64

	query := r.db.Model(&authModel.User{})
	if search != "" {
		query = query.Where("name ILIKE ? OR email ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	query.Count(&total)

	err := query.Order("id DESC").Offset(offset).Limit(limit).Find(&users).Error
	return users, total, err
}

func (r *AdminRepository) UpdateUser(uid int, fields map[string]any) error {
	return r.db.Model(&authModel.User{}).Where("id = ?", uid).Updates(fields).Error
}

func (r *AdminRepository) DeleteUser(uid int) error {
	return r.db.Delete(&authModel.User{}, uid).Error
}

func (r *AdminRepository) GetUserByID(uid int) (*authModel.User, error) {
	var user authModel.User
	err := r.db.First(&user, uid).Error
	return &user, err
}

// ===== Creator Applications =====

func (r *AdminRepository) GetCreatorApplications(offset, limit int) ([]userModel.UserMessage, int64, error) {
	var messages []userModel.UserMessage
	var total int64

	query := r.db.Model(&userModel.UserMessage{}).Where("type = 'apply' AND status = 0")
	query.Count(&total)

	err := query.Order("created DESC").Offset(offset).Limit(limit).Find(&messages).Error
	return messages, total, err
}

func (r *AdminRepository) ApproveCreator(messageID, uid int) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&authModel.User{}).Where("id = ?", uid).
			Update("role", 2).Error; err != nil {
			return err
		}
		return tx.Model(&userModel.UserMessage{}).Where("id = ?", messageID).
			Update("status", 2).Error
	})
}

func (r *AdminRepository) DeclineCreator(messageID int) error {
	return r.db.Model(&userModel.UserMessage{}).Where("id = ?", messageID).
		Update("status", 3).Error
}

// ===== Stats =====

func (r *AdminRepository) GetStats(since time.Time) (newUser, newActive, newGalgame, newResource, newComment int64) {
	r.db.Model(&authModel.User{}).Where("created >= ?", since).Count(&newUser)
	r.db.Model(&authModel.User{}).Where("last_login_time >= ?", since.Format(time.RFC3339)).Count(&newActive)
	r.db.Model(&patchModel.Patch{}).Where("created >= ?", since).Count(&newGalgame)
	r.db.Model(&patchModel.PatchResource{}).Where("created >= ?", since).Count(&newResource)
	r.db.Model(&patchModel.PatchComment{}).Where("created >= ?", since).Count(&newComment)
	return
}

func (r *AdminRepository) GetStatsSum() (userCount, galgameCount, resourceCount, commentCount int64) {
	r.db.Model(&authModel.User{}).Count(&userCount)
	r.db.Model(&patchModel.Patch{}).Count(&galgameCount)
	r.db.Model(&patchModel.PatchResource{}).Count(&resourceCount)
	r.db.Model(&patchModel.PatchComment{}).Count(&commentCount)
	return
}

// ===== Admin Logs =====

func (r *AdminRepository) GetLogs(offset, limit int) ([]adminModel.AdminLog, int64, error) {
	var logs []adminModel.AdminLog
	var total int64

	query := r.db.Model(&adminModel.AdminLog{})
	query.Count(&total)

	err := query.Order("created DESC").Offset(offset).Limit(limit).Find(&logs).Error
	return logs, total, err
}

func (r *AdminRepository) CreateLog(adminUID int, logType string, data any) error {
	content, _ := json.Marshal(data)
	log := &adminModel.AdminLog{
		Type:    logType,
		Content: string(content),
		UserID:  adminUID,
	}
	return r.db.Create(log).Error
}

// ===== Orphan Patches (D12 cleanup) =====

// GetOrphanPatches returns a paginated list of patches with galgame_id=0
// (no matching galgame found in Wiki). Ordered by resource count descending so
// admins can prioritize "important" orphans that already have resources.
//
// Two categories:
//   - vndb_id LIKE 'pending-%': vndb_id was not filled at creation time
//   - vndb_id looks like vN but Wiki lookup fails: typo or deleted in Wiki
func (r *AdminRepository) GetOrphanPatches(offset, limit int) ([]patchModel.Patch, int64, error) {
	var patches []patchModel.Patch
	var total int64
	query := r.db.Model(&patchModel.Patch{}).Where("galgame_id = 0")
	query.Count(&total)
	err := query.Order("resource_count DESC, comment_count DESC, favorite_count DESC, id ASC").
		Offset(offset).Limit(limit).
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name", "avatar")
		}).Find(&patches).Error
	return patches, total, err
}

// CountOrphanPatches returns totals for galgame_id=0 split into pending vs. valid-format-but-missing-in-Wiki.
func (r *AdminRepository) CountOrphanPatches() (pendingCount, badVndbCount int64, err error) {
	if err := r.db.Model(&patchModel.Patch{}).
		Where("galgame_id = 0 AND vndb_id LIKE 'pending-%'").
		Count(&pendingCount).Error; err != nil {
		return 0, 0, err
	}
	err = r.db.Model(&patchModel.Patch{}).
		Where("galgame_id = 0 AND vndb_id NOT LIKE 'pending-%'").
		Count(&badVndbCount).Error
	return
}
