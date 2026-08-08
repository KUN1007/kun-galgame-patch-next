package markdown

import (
	"regexp"

	"github.com/microcosm-cc/bluemonday"
)

var sanitizer = newSanitizePolicy()

func Sanitize(html string) string { return sanitizer.Sanitize(html) }

func newSanitizePolicy() *bluemonday.Policy {
	p := bluemonday.UGCPolicy()

	p.AllowRelativeURLs(true)

	p.AllowAttrs("class").Globally()

	p.AllowAttrs("id").OnElements("h1", "h2", "h3", "h4", "h5", "h6")

	p.AllowAttrs("data-id").OnElements("a")

	p.AllowAttrs("width", "height").Matching(regexp.MustCompile(`^[0-9]+$`)).OnElements("img")
	p.AllowAttrs("data-thumbhash").Matching(regexp.MustCompile(`^[A-Za-z0-9+/=]+$`)).OnElements("img")

	p.AllowElements("input")
	p.AllowAttrs("type").Matching(regexp.MustCompile(`^checkbox$`)).OnElements("input")
	p.AllowAttrs("checked", "disabled").OnElements("input")

	p.AllowAttrs("align").OnElements("td", "th")

	return p
}
