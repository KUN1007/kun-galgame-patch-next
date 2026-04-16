package response

import (
	"kun-galgame-patch-api/pkg/errors"

	"github.com/gofiber/fiber/v2"
)

type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    any `json:"data"`
}

type PaginatedResponse struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    any `json:"data"`
	Total   int64       `json:"total"`
}

func OK(c *fiber.Ctx, data any) error {
	return c.JSON(Response{
		Code:    0,
		Message: "OK",
		Data:    data,
	})
}

func OKMessage(c *fiber.Ctx, msg string) error {
	return c.JSON(Response{
		Code:    0,
		Message: msg,
		Data:    nil,
	})
}

func Paginated(c *fiber.Ctx, data any, total int64) error {
	return c.JSON(PaginatedResponse{
		Code:    0,
		Message: "OK",
		Data:    data,
		Total:   total,
	})
}

func Error(c *fiber.Ctx, err *errors.AppError) error {
	return c.Status(err.HTTPStatus).JSON(Response{
		Code:    err.Code,
		Message: err.Message,
		Data:    nil,
	})
}
