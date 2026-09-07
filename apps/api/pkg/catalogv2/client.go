package catalogv2

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

var (
	ErrNotConfigured = errors.New("catalogv2: not configured")
	ErrNotFound      = errors.New("catalogv2: not found")
	ErrUnauthorized  = errors.New("catalogv2: unauthorized")
	ErrForbidden     = errors.New("catalogv2: forbidden")
	ErrNoAccessToken = errors.New("catalogv2: no access token on the session")
)

type Problem struct {
	Type      string         `json:"type"`
	Title     string         `json:"title"`
	Status    int            `json:"status"`
	Detail    string         `json:"detail"`
	Code      string         `json:"code"`
	Object    string         `json:"object"`
	CurrentID string         `json:"current_id"`
	Errors    []ProblemField `json:"errors"`
}

// Exactly one of Pointer / Parameter / Header is set. The pointer prefix is not
// consistent — a validation failure emits "/<key>", an unknown or locked field
// emits "/patch/<key>" — which is why the browser side parses it rather than
// this one.
type ProblemField struct {
	Pointer   string `json:"pointer,omitempty"`
	Parameter string `json:"parameter,omitempty"`
	Header    string `json:"header,omitempty"`
	Reason    string `json:"reason"`
	Detail    string `json:"detail"`
}

func (p *Problem) Error() string {
	if p == nil {
		return ""
	}
	if p.Detail != "" {
		return p.Detail
	}
	return p.Title
}

func (p *Problem) Merged() bool {
	return p != nil && p.Code == "ENTITY_MERGED" && p.CurrentID != ""
}

type Client struct {
	http   *http.Client
	origin string
	apiKey string
	rdb    *redis.Client
}

func New(baseURL, apiKey string) *Client {
	return &Client{
		http: &http.Client{
			Timeout: 10 * time.Second,
			CheckRedirect: func(*http.Request, []*http.Request) error {
				return http.ErrUseLastResponse
			},
		},
		origin: origin(baseURL),
		apiKey: strings.TrimSpace(apiKey),
	}
}

func origin(raw string) string {
	u := strings.TrimRight(strings.TrimSpace(raw), "/")
	for _, suf := range []string{"/api/v1", "/v2", "/v1"} {
		if strings.HasSuffix(u, suf) {
			return strings.TrimSuffix(u, suf)
		}
	}
	return u
}

func (c *Client) Configured() bool {
	return c != nil && c.origin != "" && c.apiKey != ""
}

// Every S2S read goes through here, so this is where the shared read cache
// belongs; user-token reads take userDo and are never cached. Decoding into a
// json.RawMessage is what makes one body serve both the cache and the caller:
// do() hands the verbatim bytes back without a second request, and a 204 or an
// empty body leaves raw nil, exactly as before.
func (c *Client) get(ctx context.Context, path string, out any) error {
	if body, ok := c.cacheGet(ctx, path); ok {
		return json.Unmarshal(body, out)
	}
	var raw json.RawMessage
	if _, err := c.do(ctx, http.MethodGet, path, "", "", nil, &raw); err != nil {
		return err
	}
	if len(raw) == 0 {
		return nil
	}
	c.cacheSet(ctx, path, raw)
	return json.Unmarshal(raw, out)
}

func (c *Client) do(ctx context.Context, method, path, userToken, ifMatch string, body any, out any) (string, error) {
	if !c.Configured() {
		return "", ErrNotConfigured
	}
	var rdr io.Reader
	if body != nil {
		raw, err := json.Marshal(body)
		if err != nil {
			return "", err
		}
		rdr = bytes.NewReader(raw)
	}
	req, err := http.NewRequestWithContext(ctx, method, c.origin+path, rdr)
	if err != nil {
		return "", err
	}
	if userToken != "" {
		req.Header.Set("Authorization", "Bearer "+userToken)
	} else {
		req.Header.Set("Authorization", "Bearer "+c.apiKey)
	}
	if ifMatch != "" {
		req.Header.Set("If-Match", ifMatch)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	req.Header.Set("Accept", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return "", fmt.Errorf("catalog v2 request: %w", err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("catalog v2 read: %w", err)
	}
	etag := strings.TrimSpace(resp.Header.Get("ETag"))
	if resp.StatusCode == http.StatusNoContent || resp.StatusCode == http.StatusNotModified {
		return etag, nil
	}
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		if out == nil || len(raw) == 0 || string(raw) == "null" {
			return etag, nil
		}
		if err := json.Unmarshal(raw, out); err != nil {
			return etag, fmt.Errorf("catalog v2 decode: %w", err)
		}
		return etag, nil
	}
	var p Problem
	_ = json.Unmarshal(raw, &p)
	if p.Status == 0 {
		p.Status = resp.StatusCode
	}
	if p.Detail == "" {
		p.Detail = strings.TrimSpace(string(raw))
	}
	if p.Merged() {
		return etag, &p
	}
	if resp.StatusCode == http.StatusNotFound {
		return etag, ErrNotFound
	}
	if p.Code == "" && resp.StatusCode == http.StatusUnauthorized {
		return etag, ErrUnauthorized
	}
	if p.Code == "" && resp.StatusCode == http.StatusForbidden {
		return etag, ErrForbidden
	}
	return etag, &p
}

func (c *Client) userDo(ctx context.Context, method, path, accessToken string, body, out any) (string, error) {
	if accessToken == "" {
		return "", ErrNoAccessToken
	}
	return c.do(ctx, method, path, accessToken, "", body, out)
}
