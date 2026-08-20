package common

import (
	"strconv"

	galgameClient "kun-galgame-patch-api/internal/galgame/client"
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/response"
	"kun-galgame-patch-api/pkg/utils"

	"github.com/gofiber/fiber/v3"
)

func (h *CommonHandler) GetGalgameCharacter(c fiber.Ctx) error {
	id, err := entityID(c)
	if err != nil {
		return response.Error(c, err)
	}
	detail, cerr := h.galgame.GetCharacter(c.Context(), id, utils.ContentLimitForListBrowse(c))
	if cerr != nil {
		return response.Error(c, catalogEntityError(cerr, "角色"))
	}
	return response.OK(c, detail)
}

func (h *CommonHandler) GetGalgameStaff(c fiber.Ctx) error {
	id, err := entityID(c)
	if err != nil {
		return response.Error(c, err)
	}
	detail, cerr := h.galgame.GetStaff(c.Context(), id)
	if cerr != nil {
		return response.Error(c, catalogEntityError(cerr, "制作人员"))
	}
	return response.OK(c, detail)
}

func entityID(c fiber.Ctx) (int, *errors.AppError) {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return 0, errors.ErrBadRequest("无效的 ID")
	}
	return id, nil
}

// A catalog merge answers 301 rather than 404, and the id that survived is in
// the body — the same shape the taxonomy proxy already handles.
func catalogEntityError(err error, subject string) *errors.AppError {
	if galgameClient.IsAbsent(err) {
		return errors.ErrNotFound(subject + "不存在")
	}
	if _, ok := galgameClient.MovedTarget(err); ok {
		return errors.ErrNotFound(subject + "已被合并")
	}
	return errors.ErrInternal("调用 Galgame 资料库失败")
}
