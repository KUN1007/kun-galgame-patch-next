package errors_test

import (
	"testing"

	"kun-galgame-patch-api/pkg/errors"

	"github.com/stretchr/testify/assert"
)

func TestAppError_Implements_Error(t *testing.T) {
	err := errors.ErrBadRequest("test error")
	assert.Equal(t, "test error", err.Error())
}

func TestErrUnauthorized(t *testing.T) {
	err := errors.ErrUnauthorized()
	assert.Equal(t, 40100, err.Code)
	assert.Equal(t, 401, err.HTTPStatus)
	assert.NotEmpty(t, err.Message)
}

func TestErrAuthExpired(t *testing.T) {
	err := errors.ErrAuthExpired()
	assert.Equal(t, 40101, err.Code)
	assert.Equal(t, 401, err.HTTPStatus)
}

func TestErrForbidden(t *testing.T) {
	err := errors.ErrForbidden()
	assert.Equal(t, 40300, err.Code)
	assert.Equal(t, 403, err.HTTPStatus)
}

func TestErrBadRequest_Default(t *testing.T) {
	err := errors.ErrBadRequest("")
	assert.Equal(t, 40000, err.Code)
	assert.Equal(t, 400, err.HTTPStatus)
	assert.Equal(t, "Invalid request parameters", err.Message)
}

func TestErrBadRequest_Custom(t *testing.T) {
	err := errors.ErrBadRequest("custom message")
	assert.Equal(t, "custom message", err.Message)
}

func TestErrNotFound_Default(t *testing.T) {
	err := errors.ErrNotFound("")
	assert.Equal(t, 40400, err.Code)
	assert.Equal(t, 404, err.HTTPStatus)
	assert.Equal(t, "Resource not found", err.Message)
}

func TestErrInternal_Default(t *testing.T) {
	err := errors.ErrInternal("")
	assert.Equal(t, 50000, err.Code)
	assert.Equal(t, 500, err.HTTPStatus)
}

func TestErrValidation(t *testing.T) {
	err := errors.ErrValidation("field is invalid")
	assert.Equal(t, 42200, err.Code)
	assert.Equal(t, 422, err.HTTPStatus)
}

func TestErrConflict(t *testing.T) {
	err := errors.ErrConflict("already exists")
	assert.Equal(t, 40900, err.Code)
	assert.Equal(t, 409, err.HTTPStatus)
}

func TestErrTooManyRequests(t *testing.T) {
	err := errors.ErrTooManyRequests("")
	assert.Equal(t, 42900, err.Code)
	assert.Equal(t, 429, err.HTTPStatus)
	assert.NotEmpty(t, err.Message)
}

func TestNew(t *testing.T) {
	err := errors.New(12345, "custom", 418)
	assert.Equal(t, 12345, err.Code)
	assert.Equal(t, "custom", err.Message)
	assert.Equal(t, 418, err.HTTPStatus)
}
