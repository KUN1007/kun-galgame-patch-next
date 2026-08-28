package utils

import (
	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

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

// ScopePatchContentLimit narrows a patch query to the rows the reader's gate
// will keep, so a page and its COUNT agree with what survives enrichment.
// Apply it to the builder that produces both, or the pager keeps counting rows
// the page no longer shows.
//
// What actually hides a work is catalog's own gate, applied when the page is
// hydrated; patch.content_limit (032) only decides which ids get that far. NULL
// means "not mirrored yet" and passes — which is why the column could ship
// ahead of its sync, and why a stale value costs a short row and never a leak.
func ScopePatchContentLimit(q *gorm.DB, contentLimit string) *gorm.DB {
	switch contentLimit {
	case ContentLimitSFW, ContentLimitNSFW:
		return q.Where("patch.content_limit IS NULL OR patch.content_limit = ?", contentLimit)
	}
	return q
}
