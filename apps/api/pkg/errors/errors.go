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

// Authentication related
func ErrUnauthorized() *AppError {
	return New(40100, "Please log in first", fiber.StatusUnauthorized)
}

func ErrAuthExpired() *AppError {
	return New(40101, "Session expired, please log in again", fiber.StatusUnauthorized)
}

func ErrForbidden() *AppError {
	return New(40300, "Insufficient permissions", fiber.StatusForbidden)
}

// Request related
func ErrBadRequest(msg string) *AppError {
	if msg == "" {
		msg = "Invalid request parameters"
	}
	return New(40000, msg, fiber.StatusBadRequest)
}

func ErrNotFound(msg string) *AppError {
	if msg == "" {
		msg = "Resource not found"
	}
	return New(40400, msg, fiber.StatusNotFound)
}

func ErrValidation(msg string) *AppError {
	return New(42200, msg, fiber.StatusUnprocessableEntity)
}

// Server related
func ErrInternal(msg string) *AppError {
	if msg == "" {
		msg = "Internal server error"
	}
	return New(50000, msg, fiber.StatusInternalServerError)
}

// Business related
func ErrBusiness(msg string) *AppError {
	return New(40000, msg, fiber.StatusBadRequest)
}

func ErrConflict(msg string) *AppError {
	return New(40900, msg, fiber.StatusConflict)
}

func ErrTooManyRequests(msg string) *AppError {
	if msg == "" {
		msg = "Too many requests, please try again later"
	}
	return New(42900, msg, fiber.StatusTooManyRequests)
}
