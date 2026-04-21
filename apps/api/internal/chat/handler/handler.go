// Package handler 聊天模块的 HTTP handlers。
//
// D9（2026-04-21）：9 个 REST 端点，不涉及 WebSocket。
package handler

import (
	"strconv"

	"kun-galgame-patch-api/internal/chat/dto"
	"kun-galgame-patch-api/internal/chat/service"
	"kun-galgame-patch-api/internal/middleware"
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/response"
	"kun-galgame-patch-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
)

type ChatHandler struct {
	svc *service.ChatService
}

func New(svc *service.ChatService) *ChatHandler {
	return &ChatHandler{svc: svc}
}

func getMessageIDParam(c *fiber.Ctx) (int, error) {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id < 1 {
		return 0, errors.ErrBadRequest("invalid message id")
	}
	return id, nil
}

// ─── Room ───────────────────────────────────────────

// ListRooms GET /api/chat/room
func (h *ChatHandler) ListRooms(c *fiber.Ctx) error {
	user := middleware.MustGetUser(c)
	rooms, err := h.svc.ListRooms(user.UID)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.OK(c, rooms)
}

// CreateRoom POST /api/chat/room   （role ≥ 4）
func (h *ChatHandler) CreateRoom(c *fiber.Ctx) error {
	user := middleware.MustGetUser(c)
	if user.Role < 4 {
		return response.Error(c, errors.ErrForbidden())
	}
	var req dto.CreateRoomRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	room, err := h.svc.CreateGroupRoom(user.UID, req.Name, req.Avatar)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	return response.OK(c, room)
}

// JoinRoom POST /api/chat/room/join
func (h *ChatHandler) JoinRoom(c *fiber.Ctx) error {
	user := middleware.MustGetUser(c)
	var req dto.JoinRoomRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	room, err := h.svc.JoinRoomByLink(user.UID, req.Link)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	return response.OK(c, room)
}

// ─── Messages ───────────────────────────────────────

// ListMessages GET /api/chat/room/:link/message?after=&limit=
func (h *ChatHandler) ListMessages(c *fiber.Ctx) error {
	user := middleware.MustGetUser(c)
	link := c.Params("link")

	var q dto.ListMessagesQuery
	if err := utils.ParseQueryAndValidate(c, &q); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	if q.Limit == 0 {
		q.Limit = 30
	}

	msgs, err := h.svc.GetMessages(user.UID, link, q.After, q.Limit)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	return response.OK(c, msgs)
}

// CreateMessage POST /api/chat/room/:link/message
func (h *ChatHandler) CreateMessage(c *fiber.Ctx) error {
	user := middleware.MustGetUser(c)
	link := c.Params("link")

	var req dto.CreateMessageRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	msg, err := h.svc.CreateMessage(user.UID, link, req.Content, req.FileURL, req.ReplyToID)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	return response.OK(c, msg)
}

// UpdateMessage PUT /api/chat/message/:id
func (h *ChatHandler) UpdateMessage(c *fiber.Ctx) error {
	user := middleware.MustGetUser(c)
	id, err := getMessageIDParam(c)
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.UpdateMessageRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	if err := h.svc.UpdateMessage(user.UID, id, req.Content); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	return response.OKMessage(c, "消息已编辑")
}

// DeleteMessage DELETE /api/chat/message/:id
func (h *ChatHandler) DeleteMessage(c *fiber.Ctx) error {
	user := middleware.MustGetUser(c)
	id, err := getMessageIDParam(c)
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}
	if err := h.svc.DeleteMessage(user.UID, user.Role, id); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	return response.OKMessage(c, "消息已删除")
}

// ToggleReaction POST /api/chat/message/:id/reaction
func (h *ChatHandler) ToggleReaction(c *fiber.Ctx) error {
	user := middleware.MustGetUser(c)
	id, err := getMessageIDParam(c)
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.ReactionRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	added, err := h.svc.ToggleReaction(user.UID, id, req.Emoji)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	return response.OK(c, map[string]bool{"added": added})
}

// MarkSeen PUT /api/chat/room/:link/seen
func (h *ChatHandler) MarkSeen(c *fiber.Ctx) error {
	user := middleware.MustGetUser(c)
	link := c.Params("link")

	var req dto.SeenRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	if err := h.svc.MarkSeen(user.UID, link, req.MessageIDs); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	return response.OKMessage(c, "已标记")
}
