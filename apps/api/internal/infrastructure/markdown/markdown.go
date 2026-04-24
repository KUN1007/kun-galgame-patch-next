// Package markdown provides markdown-to-sanitized-HTML rendering.
//
// Used for user-editable rich text such as patch comments, chat messages, and
// resource descriptions. Currently uses goldmark + GFM extensions; math,
// spoiler, lazy image loading etc. can be added as needed.
package markdown

import (
	"bytes"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/renderer/html"
)

// md is a singleton with out-of-the-box GFM configuration.
var md = goldmark.New(
	goldmark.WithExtensions(
		extension.GFM,         // tables, strikethrough, autolinks, task lists
		extension.Linkify,
		extension.Strikethrough,
		extension.Table,
		extension.TaskList,
	),
	goldmark.WithParserOptions(
		parser.WithAutoHeadingID(),
	),
	goldmark.WithRendererOptions(
		html.WithHardWraps(),
		html.WithXHTML(),
		// User input may contain HTML, but goldmark does not render raw HTML by
		// default; we keep the default (safe). Callers who need to allow it
		// should sanitize themselves.
	),
)

// Render renders markdown text to HTML. The returned HTML string can be written into templates directly.
func Render(src string) (string, error) {
	var buf bytes.Buffer
	if err := md.Convert([]byte(src), &buf); err != nil {
		return "", err
	}
	return buf.String(), nil
}

// MustRender returns the original text on render failure (as a fallback).
func MustRender(src string) string {
	out, err := Render(src)
	if err != nil {
		return src
	}
	return out
}
