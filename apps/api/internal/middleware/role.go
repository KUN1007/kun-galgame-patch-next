package middleware

import (
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/response"

	"github.com/gofiber/fiber/v3"
)

func RequireRole(roles ...string) fiber.Handler {
	return func(c fiber.Ctx) error {
		if GetUser(c) == nil {
			return response.Error(c, errors.ErrUnauthorized())
		}
		if !HasAnyRole(c, roles...) {
			return response.Error(c, errors.ErrForbidden())
		}
		return c.Next()
	}
}
