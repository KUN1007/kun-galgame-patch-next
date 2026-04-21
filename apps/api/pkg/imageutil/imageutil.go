// Package imageutil 提供轻量的图片处理工具：解码 → fit-inside 缩放 → JPEG 编码。
//
// 用于上传 banner / avatar / 用户配图等场景。原项目用 sharp + avif，Go 端先用 JPEG
// 做兼容性和易用性的平衡，将来需要 AVIF/WebP 输出可以替换。
package imageutil

import (
	"bytes"
	"fmt"
	"image"
	_ "image/gif"
	"image/jpeg"
	_ "image/png"

	"github.com/disintegration/imaging"
	_ "golang.org/x/image/webp"
)

// FitJPEG 解码任意常见格式（JPG/PNG/GIF/WebP）的图片字节，按 fit-inside 缩放到
// (maxW, maxH) 以内，不放大，使用 Lanczos 滤波器，再以 JPEG quality 编码。
func FitJPEG(raw []byte, maxW, maxH, quality int) ([]byte, error) {
	img, _, err := image.Decode(bytes.NewReader(raw))
	if err != nil {
		return nil, fmt.Errorf("解码图片失败: %w", err)
	}
	resized := imaging.Fit(img, maxW, maxH, imaging.Lanczos)

	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, resized, &jpeg.Options{Quality: quality}); err != nil {
		return nil, fmt.Errorf("编码 JPEG 失败: %w", err)
	}
	return buf.Bytes(), nil
}
