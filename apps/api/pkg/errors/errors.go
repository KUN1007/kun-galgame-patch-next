package errors

import "github.com/gofiber/fiber/v2"

type AppError struct {
	Code       int    `json:"code"`
	Message    string `json:"message"`
	HTTPStatus int    `json:"-"`
}

func (e *AppError) Error() string {
	return e.Message
}

func New(code int, message string, httpStatus int) *AppError {
	return &AppError{Code: code, Message: message, HTTPStatus: httpStatus}
}

// 认证相关
func ErrUnauthorized() *AppError {
	return New(40100, "请先登录", fiber.StatusUnauthorized)
}

func ErrAuthExpired() *AppError {
	return New(40101, "登录已过期，请重新登录", fiber.StatusUnauthorized)
}

func ErrForbidden() *AppError {
	return New(40300, "权限不足", fiber.StatusForbidden)
}

// 请求相关
func ErrBadRequest(msg string) *AppError {
	if msg == "" {
		msg = "请求参数错误"
	}
	return New(40000, msg, fiber.StatusBadRequest)
}

func ErrNotFound(msg string) *AppError {
	if msg == "" {
		msg = "资源不存在"
	}
	return New(40400, msg, fiber.StatusNotFound)
}

func ErrValidation(msg string) *AppError {
	return New(42200, msg, fiber.StatusUnprocessableEntity)
}

// 服务端相关
func ErrInternal(msg string) *AppError {
	if msg == "" {
		msg = "服务器内部错误"
	}
	return New(50000, msg, fiber.StatusInternalServerError)
}

// 业务相关
func ErrBusiness(msg string) *AppError {
	return New(40000, msg, fiber.StatusBadRequest)
}

func ErrConflict(msg string) *AppError {
	return New(40900, msg, fiber.StatusConflict)
}

func ErrTooManyRequests(msg string) *AppError {
	if msg == "" {
		msg = "请求过于频繁，请稍后再试"
	}
	return New(42900, msg, fiber.StatusTooManyRequests)
}
