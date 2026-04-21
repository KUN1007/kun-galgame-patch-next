// Package markdown 提供 markdown → sanitized HTML 的渲染。
//
// 用于补丁评论、聊天消息、资源描述等用户可编辑的富文本场景。
// 当前使用 goldmark + GFM 扩展；未来可按需引入数学、spoiler、图片懒加载等。
package markdown

import (
	"bytes"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/renderer/html"
)

// md 单例，开箱即用的 GFM 配置。
var md = goldmark.New(
	goldmark.WithExtensions(
		extension.GFM,         // 表格、删除线、自动链接、任务列表
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
		// 用户输入可能含 HTML，但 goldmark 默认不会渲染 raw HTML，
		// 这里保持默认（安全）。如果需要放开，调用方自己做 sanitize。
	),
)

// Render 把 markdown 文本渲染为 HTML。返回的 HTML 字符串可以直接写进模板。
func Render(src string) (string, error) {
	var buf bytes.Buffer
	if err := md.Convert([]byte(src), &buf); err != nil {
		return "", err
	}
	return buf.String(), nil
}

// MustRender 渲染失败时返回原文（作降级处理）。
func MustRender(src string) string {
	out, err := Render(src)
	if err != nil {
		return src
	}
	return out
}
