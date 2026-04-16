package repository

import (
	"kun-galgame-patch-api/internal/user/model"

	"gorm.io/gorm"
)

type MessageRepository struct {
	db *gorm.DB
}

func New(db *gorm.DB) *MessageRepository {
	return &MessageRepository{db: db}
}

// GetMessages retrieves messages for a user, optionally filtered by type
func (r *MessageRepository) GetMessages(recipientID int, msgType string, offset, limit int) ([]model.UserMessage, int64, error) {
	var messages []model.UserMessage
	var total int64

	query := r.db.Model(&model.UserMessage{}).Where("recipient_id = ?", recipientID)
	if msgType != "" {
		query = query.Where("type = ?", msgType)
	}
	query.Count(&total)

	err := query.Order("created DESC").Offset(offset).Limit(limit).Find(&messages).Error
	return messages, total, err
}

// GetUnreadTypes returns distinct types of unread messages
func (r *MessageRepository) GetUnreadTypes(recipientID int) ([]string, error) {
	var types []string
	err := r.db.Model(&model.UserMessage{}).
		Where("recipient_id = ? AND status = 0", recipientID).
		Distinct("type").Pluck("type", &types).Error
	return types, err
}

// CreateMessage creates a new message
func (r *MessageRepository) CreateMessage(msg *model.UserMessage) error {
	return r.db.Create(msg).Error
}

// MarkAsRead marks messages as read by type (or all if type is "all")
func (r *MessageRepository) MarkAsRead(recipientID int, msgType string) error {
	query := r.db.Model(&model.UserMessage{}).Where("recipient_id = ? AND status = 0", recipientID)
	if msgType != "all" {
		query = query.Where("type = ?", msgType)
	}
	return query.Update("status", 1).Error
}
