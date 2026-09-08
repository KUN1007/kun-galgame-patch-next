package service

import (
	"encoding/base64"
	"fmt"
	"slices"
	"strconv"
	"strings"

	"kun-galgame-patch-api/pkg/problem"

	"github.com/gofiber/fiber/v3"
)

// Parameter parsing shared by every collection on the face. Exported where the
// resource collections, which take no PatchQuery, need the same rule.

// ParseCursor decodes the platform's opaque cursor.
func ParseCursor(c fiber.Ctx) (int, *problem.Problem) {
	raw := c.Query("cursor")
	if raw == "" {
		return 0, nil
	}
	invalid := problem.Param(problem.CodeInvalidCursor, "cursor", problem.ReasonInvalidFormat,
		"pass the next_cursor from a previous page of this collection")
	payload, ok := strings.CutPrefix(raw, "cur_")
	if !ok {
		return 0, invalid
	}
	decoded, err := base64.RawURLEncoding.DecodeString(payload)
	if err != nil {
		return 0, invalid
	}
	n, err := strconv.Atoi(string(decoded))
	if err != nil || n < 0 {
		return 0, invalid
	}
	return n, nil
}

// EncodeCursor mints the platform's opaque cursor, byte for byte the encoding
// infra's collect.EncodeOffset produces.
func EncodeCursor(offset int) *string {
	if offset <= 0 {
		return nil
	}
	out := "cur_" + base64.RawURLEncoding.EncodeToString([]byte(strconv.Itoa(offset)))
	return &out
}

func ParseInclude(c fiber.Ctx, allowed []string) (Includes, *problem.Problem) {
	out := Includes{}
	raw := c.Query("include")
	if raw == "" {
		return out, nil
	}
	for _, token := range strings.Split(raw, ",") {
		token = strings.TrimSpace(token)
		if token == "" {
			continue
		}
		if !slices.Contains(allowed, token) {
			return nil, problem.Param(problem.CodeUnknownInclude, "include", problem.ReasonUnknownValue,
				fmt.Sprintf("unknown include %q; this collection offers %s", token, strings.Join(allowed, ", ")))
		}
		out[token] = true
	}
	return out, nil
}

func parseEnumCSV(c fiber.Ctx, name string, allowed []string) ([]string, *problem.Problem) {
	raw := c.Query(name)
	if raw == "" {
		return nil, nil
	}
	out := make([]string, 0, 4)
	for _, token := range strings.Split(raw, ",") {
		token = strings.TrimSpace(token)
		if token == "" {
			continue
		}
		if !slices.Contains(allowed, token) {
			return nil, problem.Param(problem.CodeUnknownEnumValue, name, problem.ReasonUnknownValue,
				fmt.Sprintf("unknown %s %q; the vocabulary is %s", name, token, strings.Join(allowed, ", ")))
		}
		if !slices.Contains(out, token) {
			out = append(out, token)
		}
	}
	return out, nil
}

func ParseBool(c fiber.Ctx, name string, fallback bool) (bool, *problem.Problem) {
	switch c.Query(name) {
	case "":
		return fallback, nil
	case "true":
		return true, nil
	case "false":
		return false, nil
	default:
		return false, problem.Param(problem.CodeInvalidParameter, name, problem.ReasonInvalidFormat,
			name+" must be true or false")
	}
}

func parseOptionalBool(c fiber.Ctx, name string) (*bool, *problem.Problem) {
	if c.Query(name) == "" {
		return nil, nil
	}
	v, err := ParseBool(c, name, false)
	if err != nil {
		return nil, err
	}
	return &v, nil
}
