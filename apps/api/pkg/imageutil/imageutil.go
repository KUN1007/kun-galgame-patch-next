// Package imageutil offers a lightweight image toolchain: decode -> fit-inside resize -> JPEG encode.
//
// Used for uploading banners, avatars, user images, etc. The original project
// used sharp + avif; the Go side starts with JPEG as a balance of compatibility
// and simplicity, and can be swapped for AVIF/WebP output later.
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

// FitJPEG decodes image bytes in any common format (JPG/PNG/GIF/WebP), resizes
// fit-inside to within (maxW, maxH) (no upscaling) using the Lanczos filter,
// and encodes as JPEG with the given quality.
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
