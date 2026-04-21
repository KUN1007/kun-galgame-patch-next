// Package service 聊天模块的业务逻辑层。
//
// D9（2026-04-21）：所有读写走 REST，不再有实时推送。
// 前端 3s 轮询 GetMessages(after=lastMsgId) 拉新消息；
// 编辑/删除/表情状态变化不通过轮询同步，仅刷新页面可见。
package service

import (
	"fmt"
	"time"

	"kun-galgame-patch-api/internal/chat/model"
	"kun-galgame-patch-api/internal/chat/repository"

	"github.com/rs/xid"
	"gorm.io/gorm"
)

type ChatService struct {
	repo *repository.ChatRepository
}

func New(repo *repository.ChatRepository) *ChatService {
	return &ChatService{repo: repo}
}

// ─── Room ───────────────────────────────────────────

// ListRooms 列出用户加入的所有房间。
func (s *ChatService) ListRooms(uid int) ([]model.ChatRoom, error) {
	return s.repo.ListRoomsByUser(uid)
}

// CreateGroupRoom 创建群聊。仅 role >= 4 有权（在 handler 层校验）。
func (s *ChatService) CreateGroupRoom(ownerUID int, name, avatar string) (*model.ChatRoom, error) {
	link := xid.New().String() // 20 字符有序唯一 id
	return s.repo.CreateRoom(ownerUID, name, link, avatar)
}

// JoinRoomByLink 通过链接加入房间。
func (s *ChatService) JoinRoomByLink(uid int, link string) (*model.ChatRoom, error) {
	room, err := s.repo.FindRoomByLink(link)
	if err != nil {
		return nil, fmt.Errorf("房间不存在")
	}
	if err := s.repo.AddMember(uid, room.ID); err != nil {
		return nil, fmt.Errorf("加入失败: %w", err)
	}
	return room, nil
}

// ─── Messages ───────────────────────────────────────

// GetMessages 轮询拉取新消息。
//
// 先用 link 拿 room 并校验成员身份，再按 after/limit 拉。
func (s *ChatService) GetMessages(uid int, link string, after, limit int) ([]model.ChatMessage, error) {
	room, err := s.resolveRoomForMember(uid, link)
	if err != nil {
		return nil, err
	}
	return s.repo.ListMessages(room.ID, after, limit)
}

// CreateMessage 发送消息，更新房间的 last_message_time。
func (s *ChatService) CreateMessage(uid int, link string, content, fileURL string, replyToID *int) (*model.ChatMessage, error) {
	room, err := s.resolveRoomForMember(uid, link)
	if err != nil {
		return nil, err
	}
	if content == "" && fileURL == "" {
		return nil, fmt.Errorf("消息内容不能为空")
	}
	msg := &model.ChatMessage{
		ChatRoomID: room.ID,
		SenderID:   uid,
		Content:    content,
		FileURL:    fileURL,
		ReplyToID:  replyToID,
		Status:     "SENT",
	}
	if err := s.repo.CreateMessage(msg); err != nil {
		return nil, err
	}
	return msg, nil
}

// UpdateMessage 编辑消息。只有发送者本人可编辑。
func (s *ChatService) UpdateMessage(uid, messageID int, newContent string) error {
	m, err := s.repo.GetMessage(messageID)
	if err != nil {
		return fmt.Errorf("消息不存在")
	}
	if m.SenderID != uid {
		return fmt.Errorf("仅发送者可以编辑消息")
	}
	if m.Status == "DELETED" {
		return fmt.Errorf("已删除的消息无法编辑")
	}
	return s.repo.UpdateMessageContent(m, m.Content, newContent)
}

// DeleteMessage 软删消息。发送者或 role >= 3 可删。
func (s *ChatService) DeleteMessage(uid, role, messageID int) error {
	m, err := s.repo.GetMessage(messageID)
	if err != nil {
		return fmt.Errorf("消息不存在")
	}
	if m.SenderID != uid && role < 3 {
		return fmt.Errorf("仅发送者或管理员可删除消息")
	}
	now := time.Now()
	return s.repo.SoftDeleteMessage(messageID, uid, now)
}

// ToggleReaction 切换表情回应。
func (s *ChatService) ToggleReaction(uid, messageID int, emoji string) (bool, error) {
	if _, err := s.repo.GetMessage(messageID); err != nil {
		return false, fmt.Errorf("消息不存在")
	}
	return s.repo.ToggleReaction(messageID, uid, emoji)
}

// MarkSeen 批量已读。
func (s *ChatService) MarkSeen(uid int, link string, messageIDs []int) error {
	room, err := s.resolveRoomForMember(uid, link)
	if err != nil {
		return err
	}
	return s.repo.MarkSeen(room.ID, uid, messageIDs)
}

// ─── helpers ────────────────────────────────────────

// resolveRoomForMember 取 room 并确认 uid 是其成员，否则返回错误。
func (s *ChatService) resolveRoomForMember(uid int, link string) (*model.ChatRoom, error) {
	room, err := s.repo.FindRoomByLink(link)
	if err != nil {
		return nil, fmt.Errorf("房间不存在")
	}
	ok, err := s.repo.IsMember(uid, room.ID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, fmt.Errorf("您不是该房间的成员")
	}
	return room, nil
}

// IsNotFound 对外提供 ErrRecordNotFound 判断，便于上层区分业务错误。
func IsNotFound(err error) bool { return err == gorm.ErrRecordNotFound }
