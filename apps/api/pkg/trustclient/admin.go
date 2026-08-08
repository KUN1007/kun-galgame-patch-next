package trustclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

type AdminError struct {
	Status  int
	Code    int
	Message string
}

func (e *AdminError) Error() string {
	return fmt.Sprintf("trustclient admin: status %d code %d: %s", e.Status, e.Code, e.Message)
}

func (c *Client) doAdmin(
	ctx context.Context, method, token, path string, query url.Values, body []byte,
) (json.RawMessage, error) {
	if c.baseURL == "" {
		return nil, ErrNotConfigured
	}
	endpoint := c.baseURL + path
	if len(query) > 0 {
		endpoint += "?" + query.Encode()
	}

	var reader io.Reader
	if body != nil {
		reader = bytes.NewReader(body)
	}
	req, err := http.NewRequestWithContext(ctx, method, endpoint, reader)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)

	var env struct {
		Code    int             `json:"code"`
		Message string          `json:"message"`
		Data    json.RawMessage `json:"data"`
	}
	_ = json.Unmarshal(raw, &env)

	if resp.StatusCode == http.StatusOK && env.Code == 0 {
		return env.Data, nil
	}
	return nil, &AdminError{Status: resp.StatusCode, Code: env.Code, Message: env.Message}
}

const adminBase = "/api/v1/admin/trust"

func (c *Client) ListReviewItems(ctx context.Context, token string, query url.Values) (json.RawMessage, error) {
	return c.doAdmin(ctx, http.MethodGet, token, adminBase+"/review-items", query, nil)
}

func (c *Client) GetReviewItem(ctx context.Context, token string, id int64) (json.RawMessage, error) {
	return c.doAdmin(ctx, http.MethodGet, token, fmt.Sprintf("%s/review-items/%d", adminBase, id), nil, nil)
}

func (c *Client) ClaimReviewItem(ctx context.Context, token string, id int64) (json.RawMessage, error) {
	return c.doAdmin(ctx, http.MethodPost, token, fmt.Sprintf("%s/review-items/%d/claim", adminBase, id), nil, nil)
}

func (c *Client) DecideReviewItem(ctx context.Context, token string, id int64, body []byte) (json.RawMessage, error) {
	return c.doAdmin(ctx, http.MethodPost, token, fmt.Sprintf("%s/review-items/%d/decide", adminBase, id), nil, body)
}
