package markdown

import (
	"bytes"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"unicode"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/renderer"
	"github.com/yuin/goldmark/renderer/html"
	"github.com/yuin/goldmark/text"
	"github.com/yuin/goldmark/util"
)

type TOCItem struct {
	ID    string `json:"id"`
	Text  string `json:"text"`
	Level int    `json:"level"`
}

type cjkIDs struct {
	values map[string]bool
}

func newCJKIDs() parser.IDs {
	return &cjkIDs{values: map[string]bool{}}
}

func (s *cjkIDs) Generate(value []byte, kind ast.NodeKind) []byte {
	raw := strings.ToLower(strings.TrimSpace(string(value)))
	var b strings.Builder
	b.Grow(len(raw))
	for _, r := range raw {
		switch {
		case unicode.IsSpace(r):
			b.WriteByte('-')
		case r == '-' || r == '_':
			b.WriteRune(r)
		case unicode.IsLetter(r) || unicode.IsDigit(r):
			b.WriteRune(r)
		}
	}
	id := strings.Trim(b.String(), "-")
	if id == "" {
		id = "section"
	}
	if !s.values[id] {
		s.values[id] = true
		return []byte(id)
	}
	for i := 1; ; i++ {
		candidate := fmt.Sprintf("%s-%d", id, i)
		if !s.values[candidate] {
			s.values[candidate] = true
			return []byte(candidate)
		}
	}
}

func (s *cjkIDs) Put(value []byte) { s.values[string(value)] = true }

var mentionURLRegex = regexp.MustCompile(`^/user/(\d+)(?:/.*)?$`)

var contentImageRefRegex = regexp.MustCompile(`^/image/([0-9a-f]{64})$`)

var resolveContentImage func(hash string) string

func SetContentImageResolver(fn func(hash string) string) { resolveContentImage = fn }

func init() {
	html.ImageAttributeFilter = html.ImageAttributeFilter.Extend([]byte("data-thumbhash"))
}

type ImageMeta struct {
	Width     int
	Height    int
	Thumbhash string
}

var resolveContentImageMeta func(hashes []string) map[string]ImageMeta

func SetContentImageMetaResolver(fn func(hashes []string) map[string]ImageMeta) {
	resolveContentImageMeta = fn
}

var imageMetaContextKey = parser.NewContextKey()

func contentImageHashes(src string) []string {
	ms := contentImageTokenRegex.FindAllStringSubmatch(src, -1)
	if len(ms) == 0 {
		return nil
	}
	seen := make(map[string]struct{}, len(ms))
	out := make([]string, 0, len(ms))
	for _, m := range ms {
		if _, ok := seen[m[1]]; ok {
			continue
		}
		seen[m[1]] = struct{}{}
		out = append(out, m[1])
	}
	return out
}

func newRenderContext(src string) parser.Context {
	ctx := parser.NewContext(parser.WithIDs(newCJKIDs()))
	if resolveContentImageMeta != nil {
		if hashes := contentImageHashes(src); len(hashes) > 0 {
			if meta := resolveContentImageMeta(hashes); len(meta) > 0 {
				ctx.Set(imageMetaContextKey, meta)
			}
		}
	}
	return ctx
}

var contentImageTokenRegex = regexp.MustCompile(`/image/([0-9a-f]{64})`)

func ResolveContentImageTokens(src string) string {
	resolve := resolveContentImage
	if resolve == nil || src == "" {
		return src
	}
	return contentImageTokenRegex.ReplaceAllStringFunc(src, func(tok string) string {
		hash := tok[len("/image/"):]
		if url := resolve(hash); url != "" {
			return url
		}
		return tok
	})
}

type contentImageTransformer struct{}

func (contentImageTransformer) Transform(doc *ast.Document, _ text.Reader, pc parser.Context) {
	resolve := resolveContentImage
	if resolve == nil {
		return
	}
	var meta map[string]ImageMeta
	if v := pc.Get(imageMetaContextKey); v != nil {
		meta, _ = v.(map[string]ImageMeta)
	}
	_ = ast.Walk(doc, func(n ast.Node, entering bool) (ast.WalkStatus, error) {
		if !entering {
			return ast.WalkContinue, nil
		}
		img, ok := n.(*ast.Image)
		if !ok {
			return ast.WalkContinue, nil
		}
		m := contentImageRefRegex.FindSubmatch(img.Destination)
		if m == nil {
			return ast.WalkContinue, nil
		}
		hash := string(m[1])
		if url := resolve(hash); url != "" {
			img.Destination = []byte(url)
		}
		if im, ok := meta[hash]; ok {
			if im.Width > 0 {
				img.SetAttributeString("width", []byte(strconv.Itoa(im.Width)))
			}
			if im.Height > 0 {
				img.SetAttributeString("height", []byte(strconv.Itoa(im.Height)))
			}
			if im.Thumbhash != "" {
				img.SetAttributeString("data-thumbhash", []byte(im.Thumbhash))
			}
		}
		return ast.WalkContinue, nil
	})
}

var mentionPatternRegex = regexp.MustCompile(`\[@[^\]]*\]\(/user/(\d+)(?:/[^)]*)?\)`)

type mentionLinkRenderer struct {
	html.Config
}

func newMentionLinkRenderer() renderer.NodeRenderer {
	return &mentionLinkRenderer{Config: html.NewConfig()}
}

func (r *mentionLinkRenderer) RegisterFuncs(reg renderer.NodeRendererFuncRegisterer) {
	reg.Register(ast.KindLink, r.renderLink)
}

func linkText(source []byte, n *ast.Link) string {
	var b strings.Builder
	for c := n.FirstChild(); c != nil; c = c.NextSibling() {
		if t, ok := c.(*ast.Text); ok {
			b.Write(t.Segment.Value(source))
		}
	}
	return b.String()
}

func (r *mentionLinkRenderer) renderLink(w util.BufWriter, source []byte, n ast.Node, entering bool) (ast.WalkStatus, error) {
	link := n.(*ast.Link)
	dest := string(link.Destination)

	uidMatch := mentionURLRegex.FindStringSubmatch(dest)
	isMention := false
	if uidMatch != nil && strings.HasPrefix(linkText(source, link), "@") {
		isMention = true
	}

	if !isMention {
		return defaultLinkRender(w, link, entering, &r.Config)
	}

	if entering {
		_, _ = w.WriteString(`<a class="kun-mention" data-id="`)
		_, _ = w.WriteString(uidMatch[1])
		_, _ = w.WriteString(`" href="`)
		_, _ = w.Write(util.EscapeHTML(util.URLEscape([]byte(dest), true)))
		_, _ = w.WriteString(`">`)
	} else {
		_, _ = w.WriteString(`</a>`)
	}
	return ast.WalkContinue, nil
}

func defaultLinkRender(w util.BufWriter, link *ast.Link, entering bool, cfg *html.Config) (ast.WalkStatus, error) {
	if entering {
		_, _ = w.WriteString(`<a href="`)
		if cfg.Unsafe || !html.IsDangerousURL(link.Destination) {
			_, _ = w.Write(util.EscapeHTML(util.URLEscape(link.Destination, true)))
		}
		_ = w.WriteByte('"')
		if link.Title != nil {
			_, _ = w.WriteString(` title="`)
			_, _ = w.Write(util.EscapeHTML(link.Title))
			_ = w.WriteByte('"')
		}
		if link.Attributes() != nil {
			html.RenderAttributes(w, link, html.LinkAttributeFilter)
		}
		_ = w.WriteByte('>')
	} else {
		_, _ = w.WriteString(`</a>`)
	}
	return ast.WalkContinue, nil
}

var md = goldmark.New(
	goldmark.WithExtensions(
		extension.GFM,
		extension.Linkify,
		extension.Strikethrough,
		extension.Table,
		extension.TaskList,
	),
	goldmark.WithParserOptions(
		parser.WithAutoHeadingID(),
		parser.WithASTTransformers(
			util.Prioritized(contentImageTransformer{}, 100),
		),
	),
	goldmark.WithRendererOptions(
		html.WithHardWraps(),
		html.WithXHTML(),
		html.WithUnsafe(),
		renderer.WithNodeRenderers(
			util.Prioritized(newMentionLinkRenderer(), 99),
		),
	),
)

func Render(src string) (string, error) {
	if src == "" {
		return "", nil
	}
	var buf bytes.Buffer
	ctx := newRenderContext(src)
	if err := md.Convert([]byte(src), &buf, parser.WithContext(ctx)); err != nil {
		return "", err
	}
	return Sanitize(buf.String()), nil
}

func MustRender(src string) string {
	out, err := Render(src)
	if err != nil {
		return src
	}
	return out
}

func RenderWithTOC(src string) (string, []TOCItem, error) {
	if src == "" {
		return "", nil, nil
	}

	source := []byte(src)
	ctx := newRenderContext(src)

	doc := md.Parser().Parse(text.NewReader(source), parser.WithContext(ctx))

	toc := make([]TOCItem, 0, 16)
	_ = ast.Walk(doc, func(n ast.Node, entering bool) (ast.WalkStatus, error) {
		if !entering {
			return ast.WalkContinue, nil
		}
		h, ok := n.(*ast.Heading)
		if !ok || h.Level > 3 {
			return ast.WalkContinue, nil
		}
		idAttr, _ := h.AttributeString("id")
		var id string
		switch v := idAttr.(type) {
		case []byte:
			id = string(v)
		case string:
			id = v
		}
		if id == "" {
			return ast.WalkContinue, nil
		}
		toc = append(toc, TOCItem{
			ID:    id,
			Text:  string(h.Text(source)),
			Level: h.Level,
		})
		return ast.WalkContinue, nil
	})

	var buf bytes.Buffer
	if err := md.Renderer().Render(&buf, source, doc); err != nil {
		return "", nil, err
	}
	return Sanitize(buf.String()), toc, nil
}

func ExtractMentionedUserIDs(src string) []int {
	matches := mentionPatternRegex.FindAllStringSubmatch(src, -1)
	if len(matches) == 0 {
		return nil
	}
	seen := make(map[int]struct{}, len(matches))
	out := make([]int, 0, len(matches))
	for _, m := range matches {
		userID, err := strconv.Atoi(m[1])
		if err != nil || userID <= 0 {
			continue
		}
		if _, ok := seen[userID]; ok {
			continue
		}
		seen[userID] = struct{}{}
		out = append(out, userID)
	}
	return out
}
