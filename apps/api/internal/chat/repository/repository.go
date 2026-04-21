// Package repository 聊天模块的数据访问层。
package repository

import (
	"fmt"

	"kun-galgame-patch-api/internal/chat/model"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ChatRepository struct {
	db *gorm.DB
}

func New(db *gorm.DB) *ChatRepository {
	return &ChatRepository{db: db}
}

// ─── Room ───────────────────────────────────────────

// FindRoomByLink 按链接查房间。
func (r *ChatRepository) FindRoomByLink(link string) (*model.ChatRoom, error) {
	var room model.ChatRoom
	err := r.db.Where("link = ?", link).First(&room).Error
	return &room, err
}

// ListRoomsByUser 列出某用户加入的所有房间，按最后消息时间倒序。
func (r *ChatRepository) ListRoomsByUser(uid int) ([]model.ChatRoom, error) {
	var rooms []model.ChatRoom
	err := r.db.
		Joins("JOIN chat_member ON chat_member.chat_room_id = chat_room.id").
		Where("chat_member.user_id = ?", uid).
		Order("chat_room.last_message_time DESC").
		Find(&rooms).Error
	return rooms, err
}

// CreateRoom 创建群聊，并把 owner 作为第一个成员写入。
func (r *ChatRepository) CreateRoom(ownerUID int, name, link, avatar string) (*model.ChatRoom, error) {
	room := &model.ChatRoom{
		Name:   name,
		Link:   link,
		Avatar: avatar,
		Type:   "GROUP",
	}
	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(room).Error; err != nil {
			return err
		}
		return tx.Create(&model.ChatMember{
			UserID:     ownerUID,
			ChatRoomID: room.ID,
			Role:       "OWNER",
		}).Error
	})
	return room, err
}

// IsMember 某用户是否是某房间成员。
func (r *ChatRepository) IsMember(uid, roomID int) (bool, error) {
	var count int64
	err := r.db.Model(&model.ChatMember{}).
		Where("user_id = ? AND chat_room_id = ?", uid, roomID).
		Count(&count).Error
	return count > 0, err
}

// AddMember 加入房间，已加入则幂等 OK。
func (r *ChatRepository) AddMember(uid, roomID int) error {
	return r.db.Clauses(clause.OnConflict{DoNothing: true}).Create(&model.ChatMember{
		UserID:     uid,
		ChatRoomID: roomID,
		Role:       "MEMBER",
	}).Error
}

// ─── Message ────────────────────────────────────────

// ListMessages 按 id > after 拉新消息，limit 上限 100。
func (r *ChatRepository) ListMessages(roomID, after, limit int) ([]model.ChatMessage, error) {
	var msgs []model.ChatMessage
	err := r.db.
		Where("chat_room_id = ? AND id > ?", roomID, after).
		Order("id ASC").
		Limit(limit).
		Find(&msgs).Error
	return msgs, err
}

// CreateMessage 写消息 + 更新房间 last_message_time（事务）。
func (r *ChatRepository) CreateMessage(m *model.ChatMessage) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(m).Error; err != nil {
			return err
		}
		return tx.Model(&model.ChatRoom{}).Where("id = ?", m.ChatRoomID).
			UpdateColumn("last_message_time", m.Created).Error
	})
}

// GetMessage 按 ID 拿单条消息。
func (r *ChatRepository) GetMessage(id int) (*model.ChatMessage, error) {
	var m model.ChatMessage
	err := r.db.First(&m, id).Error
	return &m, err
}

// UpdateMessageContent 编辑消息 + 写入编辑历史（事务）。
func (r *ChatRepository) UpdateMessageContent(m *model.ChatMessage, oldContent, newContent string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&model.ChatMessageEditHistory{
			ChatMessageID:   m.ID,
			PreviousContent: oldContent,
		}).Error; err != nil {
			return err
		}
		return tx.Model(m).Updates(map[string]any{
			"content": newContent,
			"status":  "EDITED",
		}).Error
	})
}

// SoftDeleteMessage 软删消息。
func (r *ChatRepository) SoftDeleteMessage(id, deletedByUID int, deletedAt any) error {
	return r.db.Model(&model.ChatMessage{}).Where("id = ?", id).Updates(map[string]any{
		"status":        "DELETED",
		"deleted_at":    deletedAt,
		"deleted_by_id": deletedByUID,
	}).Error
}

// ─── Reactions ──────────────────────────────────────

// ToggleReaction 切换表情回应。返回 added: true 表示新增，false 表示取消。
func (r *ChatRepository) ToggleReaction(messageID, uid int, emoji string) (added bool, err error) {
	var existing model.ChatMessageReaction
	err = r.db.Where("chat_message_id = ? AND user_id = ? AND emoji = ?", messageID, uid, emoji).
		First(&existing).Error
	if err == nil {
		// 已有 → 取消
		return false, r.db.Delete(&existing).Error
	}
	if err != gorm.ErrRecordNotFound {
		return false, err
	}
	// 没有 → 新增
	return true, r.db.Create(&model.ChatMessageReaction{
		ChatMessageID: messageID,
		UserID:        uid,
		Emoji:         emoji,
	}).Error
}

// ─── Seen ───────────────────────────────────────────

// MarkSeen 批量写已读。重复插入用 OnConflict DoNothing 忽略。
func (r *ChatRepository) MarkSeen(roomID, uid int, messageIDs []int) error {
	if len(messageIDs) == 0 {
		return nil
	}

	// 只对属于这个 room 的消息有效，先过滤
	var validIDs []int
	if err := r.db.Model(&model.ChatMessage{}).
		Where("chat_room_id = ? AND id IN ?", roomID, messageIDs).
		Pluck("id", &validIDs).Error; err != nil {
		return fmt.Errorf("校验消息归属失败: %w", err)
	}
	if len(validIDs) == 0 {
		return nil
	}

	records := make([]model.ChatMessageSeen, 0, len(validIDs))
	for _, id := range validIDs {
		records = append(records, model.ChatMessageSeen{
			ChatMessageID: id,
			UserID:        uid,
		})
	}
	return r.db.Clauses(clause.OnConflict{DoNothing: true}).Create(&records).Error
}
