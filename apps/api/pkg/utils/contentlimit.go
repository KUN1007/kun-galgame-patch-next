package utils

import "github.com/gofiber/fiber/v3"

const (
	ContentLimitSFW  = "sfw"
	ContentLimitNSFW = "nsfw"
	ContentLimitAll  = "all"
)

func ContentLimitFromQuery(c fiber.Ctx) string {
	switch c.Query("content_limit") {
	case ContentLimitSFW, ContentLimitNSFW, ContentLimitAll:
		return c.Query("content_limit")
	default:
		return ""
	}
}

func ContentLimitForListBrowse(c fiber.Ctx) string {
	if v := ContentLimitFromQuery(c); v != "" {
		return v
	}
	return ContentLimitSFW
}

func IncludeEmptyGalgames(c fiber.Ctx) bool {
	return fiber.Query(c, "include_empty", false)
}
