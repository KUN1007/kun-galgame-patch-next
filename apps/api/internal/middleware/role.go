package middleware

import (
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/response"

	"github.com/gofiber/fiber/v2"
)

func RequireRole(minRole int) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user := GetUser(c)
		if user == nil {
			return response.Error(c, errors.ErrUnauthorized())
		}
		if user.Role < minRole {
			return response.Error(c, errors.ErrForbidden())
		}
		return c.Next()
	}
}
