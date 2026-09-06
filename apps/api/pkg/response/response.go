package response

import (
	"kun-galgame-patch-api/pkg/errors"

	"github.com/gofiber/fiber/v3"
)

type Response struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    any    `json:"data"`
}

type PaginatedData struct {
	Items any   `json:"items"`
	Total int64 `json:"total"`
}

func OK(c fiber.Ctx, data any) error {
	return c.JSON(Response{
		Code:    0,
		Message: "OK",
		Data:    data,
	})
}

func OKMessage(c fiber.Ctx, msg string) error {
	return c.JSON(Response{
		Code:    0,
		Message: msg,
		Data:    nil,
	})
}

func Paginated(c fiber.Ctx, items any, total int64) error {
	return c.JSON(Response{
		Code:    0,
		Message: "OK",
		Data:    PaginatedData{Items: items, Total: total},
	})
}

func Error(c fiber.Ctx, err *errors.AppError) error {
	return ErrorData(c, err, nil)
}

// The envelope's Data slot on a REJECTION. Only the catalog edit face uses it
// so far, to carry the upstream problem's field-level errors to a form that can
// pin each message under its own field; everywhere else Data on an error stays
// null, which is what Error keeps sending.
func ErrorData(c fiber.Ctx, err *errors.AppError, data any) error {
	return c.Status(err.HTTPStatus).JSON(Response{
		Code:    err.Code,
		Message: err.Message,
		Data:    data,
	})
}
