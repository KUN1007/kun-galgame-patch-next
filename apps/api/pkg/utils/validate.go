package utils

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

var validate = validator.New()

func ParseAndValidate(c *fiber.Ctx, out interface{}) error {
	if err := c.BodyParser(out); err != nil {
		return fmt.Errorf("请求体解析失败: %w", err)
	}
	return validateStruct(out)
}

func ParseQueryAndValidate(c *fiber.Ctx, out interface{}) error {
	if err := c.QueryParser(out); err != nil {
		return fmt.Errorf("查询参数解析失败: %w", err)
	}
	return validateStruct(out)
}

func validateStruct(s interface{}) error {
	if err := validate.Struct(s); err != nil {
		if validationErrors, ok := err.(validator.ValidationErrors); ok {
			var msgs []string
			for _, e := range validationErrors {
				msgs = append(msgs, formatValidationError(e))
			}
			return fmt.Errorf("%s", strings.Join(msgs, "; "))
		}
		return err
	}
	return nil
}

func formatValidationError(e validator.FieldError) string {
	field := e.Field()
	switch e.Tag() {
	case "required":
		return fmt.Sprintf("%s 不能为空", field)
	case "min":
		return fmt.Sprintf("%s 长度不能小于 %s", field, e.Param())
	case "max":
		return fmt.Sprintf("%s 长度不能大于 %s", field, e.Param())
	case "email":
		return fmt.Sprintf("%s 不是有效的邮箱地址", field)
	case "oneof":
		return fmt.Sprintf("%s 必须是 [%s] 之一", field, e.Param())
	case "url":
		return fmt.Sprintf("%s 不是有效的 URL", field)
	default:
		return fmt.Sprintf("%s 验证失败 (%s)", field, e.Tag())
	}
}

func GetValidator() *validator.Validate {
	return validate
}
