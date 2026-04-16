package handler

import (
	"strconv"

	"kun-galgame-patch-api/internal/middleware"
	"kun-galgame-patch-api/internal/user/dto"
	"kun-galgame-patch-api/internal/user/service"
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/response"
	"kun-galgame-patch-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
)

type UserHandler struct {
	service *service.UserService
}

func New(svc *service.UserService) *UserHandler {
	return &UserHandler{service: svc}
}

func getUID(c *fiber.Ctx) (int, error) {
	uid, err := strconv.Atoi(c.Params("uid"))
	if err != nil || uid < 1 {
		return 0, errors.ErrBadRequest("invalid user ID")
	}
	return uid, nil
}

// GetUserInfo GET /api/user/:uid
func (h *UserHandler) GetUserInfo(c *fiber.Ctx) error {
	uid, err := getUID(c)
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	currentUID := middleware.GetUID(c)
	info, err := h.service.GetUserInfo(uid, currentUID)
	if err != nil {
		return response.Error(c, errors.ErrNotFound(err.Error()))
	}

	return response.OK(c, info)
}

// GetUserFloating GET /api/user/:uid/floating
func (h *UserHandler) GetUserFloating(c *fiber.Ctx) error {
	uid, err := getUID(c)
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	info, err := h.service.GetUserFloating(uid)
	if err != nil {
		return response.Error(c, errors.ErrNotFound(err.Error()))
	}

	return response.OK(c, info)
}

// GetUserPatches GET /api/user/:uid/patch
func (h *UserHandler) GetUserPatches(c *fiber.Ctx) error {
	uid, err := getUID(c)
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.GetUserProfileRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	if req.Page == 0 {
		req.Page = 1
	}
	if req.Limit == 0 {
		req.Limit = 10
	}

	data, total, err := h.service.GetUserPatches(uid, req.Page, req.Limit)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.Paginated(c, data, total)
}

// GetUserResources GET /api/user/:uid/resource
func (h *UserHandler) GetUserResources(c *fiber.Ctx) error {
	uid, err := getUID(c)
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.GetUserProfileRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	if req.Page == 0 {
		req.Page = 1
	}
	if req.Limit == 0 {
		req.Limit = 10
	}

	data, total, err := h.service.GetUserResources(uid, req.Page, req.Limit)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.Paginated(c, data, total)
}

// GetUserFavorites GET /api/user/:uid/favorite
func (h *UserHandler) GetUserFavorites(c *fiber.Ctx) error {
	uid, err := getUID(c)
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.GetUserProfileRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	if req.Page == 0 {
		req.Page = 1
	}
	if req.Limit == 0 {
		req.Limit = 10
	}

	data, total, err := h.service.GetUserFavorites(uid, req.Page, req.Limit)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.Paginated(c, data, total)
}

// GetUserComments GET /api/user/:uid/comment
func (h *UserHandler) GetUserComments(c *fiber.Ctx) error {
	uid, err := getUID(c)
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.GetUserProfileRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	if req.Page == 0 {
		req.Page = 1
	}
	if req.Limit == 0 {
		req.Limit = 10
	}

	data, total, err := h.service.GetUserComments(uid, req.Page, req.Limit)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.Paginated(c, data, total)
}

// GetUserContributions GET /api/user/:uid/contribute
func (h *UserHandler) GetUserContributions(c *fiber.Ctx) error {
	uid, err := getUID(c)
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.GetUserProfileRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	if req.Page == 0 {
		req.Page = 1
	}
	if req.Limit == 0 {
		req.Limit = 10
	}

	data, total, err := h.service.GetUserContributions(uid, req.Page, req.Limit)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.Paginated(c, data, total)
}

// UpdateUsername PUT /api/user/username
func (h *UserHandler) UpdateUsername(c *fiber.Ctx) error {
	var req dto.UpdateUsernameRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	user := middleware.MustGetUser(c)
	if err := h.service.UpdateUsername(user.UID, req.Username); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OKMessage(c, "Username updated")
}

// UpdateBio PUT /api/user/bio
func (h *UserHandler) UpdateBio(c *fiber.Ctx) error {
	var req dto.UpdateBioRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	user := middleware.MustGetUser(c)
	if err := h.service.UpdateBio(user.UID, req.Bio); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OKMessage(c, "Bio updated")
}

// UpdatePassword PUT /api/user/password
func (h *UserHandler) UpdatePassword(c *fiber.Ctx) error {
	var req dto.UpdatePasswordRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	user := middleware.MustGetUser(c)
	if err := h.service.UpdatePassword(user.UID, req.OldPassword, req.NewPassword); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OKMessage(c, "Password updated")
}

// UpdateEmail PUT /api/user/email
func (h *UserHandler) UpdateEmail(c *fiber.Ctx) error {
	var req dto.UpdateEmailRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	user := middleware.MustGetUser(c)
	if err := h.service.UpdateEmail(user.UID, req.Email, req.Code); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OKMessage(c, "Email updated")
}

// Follow PUT /api/user/:uid/follow
func (h *UserHandler) Follow(c *fiber.Ctx) error {
	uid, err := getUID(c)
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	user := middleware.MustGetUser(c)
	if err := h.service.Follow(user.UID, uid); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OKMessage(c, "Followed")
}

// Unfollow DELETE /api/user/:uid/follow
func (h *UserHandler) Unfollow(c *fiber.Ctx) error {
	uid, err := getUID(c)
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	user := middleware.MustGetUser(c)
	if err := h.service.Unfollow(user.UID, uid); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OKMessage(c, "Unfollowed")
}

// GetFollowers GET /api/user/:uid/follower
func (h *UserHandler) GetFollowers(c *fiber.Ctx) error {
	uid, err := getUID(c)
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.GetUserProfileRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	if req.Page == 0 {
		req.Page = 1
	}
	if req.Limit == 0 {
		req.Limit = 20
	}

	users, total, err := h.service.GetFollowers(uid, req.Page, req.Limit)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.Paginated(c, users, total)
}

// GetFollowing GET /api/user/:uid/following
func (h *UserHandler) GetFollowing(c *fiber.Ctx) error {
	uid, err := getUID(c)
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.GetUserProfileRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	if req.Page == 0 {
		req.Page = 1
	}
	if req.Limit == 0 {
		req.Limit = 20
	}

	users, total, err := h.service.GetFollowing(uid, req.Page, req.Limit)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.Paginated(c, users, total)
}

// CheckIn POST /api/user/check-in
func (h *UserHandler) CheckIn(c *fiber.Ctx) error {
	user := middleware.MustGetUser(c)
	points, err := h.service.CheckIn(user.UID)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OK(c, map[string]int{"moemoepoint": points})
}

// SearchUsers GET /api/user/search
func (h *UserHandler) SearchUsers(c *fiber.Ctx) error {
	var req dto.SearchUserRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	users, err := h.service.SearchUsers(req.Query)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}

	return response.OK(c, users)
}
