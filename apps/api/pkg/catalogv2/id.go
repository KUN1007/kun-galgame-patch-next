package catalogv2

import (
	"encoding/base64"
	"strconv"
	"strings"
)

func FormatID(n int64) string {
	if n <= 0 {
		return ""
	}
	return strconv.FormatInt(n, 10)
}

func ParseID(s string) (int64, bool) {
	s = strings.TrimSpace(s)
	if s == "" {
		return 0, false
	}
	n, err := strconv.ParseInt(s, 10, 64)
	if err != nil || n <= 0 {
		return 0, false
	}
	return n, true
}

func EncodeCursor(key string) string {
	if key == "" {
		return ""
	}
	return "cur_" + base64.RawURLEncoding.EncodeToString([]byte(key))
}

func PageCursor(page int) string {
	if page <= 1 {
		return ""
	}
	return EncodeCursor(strconv.Itoa(page))
}

func joinIDs(ids []int64) string {
	parts := make([]string, 0, len(ids))
	for _, id := range ids {
		if id > 0 {
			parts = append(parts, FormatID(id))
		}
	}
	return strings.Join(parts, ",")
}

func chunkIDs(ids []int64, size int) [][]int64 {
	if size < 1 {
		size = 100
	}
	out := make([][]int64, 0, len(ids)/size+1)
	for start := 0; start < len(ids); start += size {
		end := start + size
		if end > len(ids) {
			end = len(ids)
		}
		out = append(out, ids[start:end])
	}
	return out
}
