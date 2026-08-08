package catalogclient

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

const userBase = "/api/v1/user/catalog"

var ErrInsufficientScope = errors.New("catalogclient: access token lacks the catalog:edit scope")

var ErrNoAccessToken = errors.New("catalogclient: no user access token on this request")

type UserWorkSubmitRequest struct {
	ProductWorkID int64           `json:"product_work_id,omitempty"`
	Fields        map[string]any  `json:"fields"`
	Released      *WorkSubmitDate `json:"released,omitempty"`
}

func (c *Client) SubmitWorkUser(ctx context.Context, accessToken string, req UserWorkSubmitRequest) (*WorkSubmitResult, error) {
	return userPost[WorkSubmitResult](ctx, c, accessToken, userBase+"/works/submit", req)
}

type UserClaimActionRequest struct {
	ProductWorkID int64  `json:"product_work_id,omitempty"`
	Reason        string `json:"reason,omitempty"`
}

func (c *Client) ActOnClaimUser(ctx context.Context, accessToken string, workID int64, action string, req UserClaimActionRequest) (*ClaimActionResult, error) {
	return userPost[ClaimActionResult](ctx, c, accessToken,
		userBase+"/works/"+strconv.FormatInt(workID, 10)+"/claim-actions/"+action, req)
}

func (c *Client) MyClaims(ctx context.Context, accessToken string, f UserClaimFilter) (*UserClaimPage, error) {
	q := url.Values{}
	if len(f.ClaimStates) > 0 {
		q.Set("claim_state", strings.Join(f.ClaimStates, ","))
	}
	if f.Before > 0 {
		q.Set("before", strconv.FormatInt(f.Before, 10))
	}
	if f.Limit > 0 {
		q.Set("limit", strconv.Itoa(f.Limit))
	}
	path := userBase + "/claims/mine"
	if len(q) > 0 {
		path += "?" + q.Encode()
	}
	return userDo[UserClaimPage](ctx, c, http.MethodGet, accessToken, path, nil)
}

func userPost[T any](ctx context.Context, c *Client, accessToken, path string, body any) (*T, error) {
	raw, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("encode catalog body: %w", err)
	}
	return userDo[T](ctx, c, http.MethodPost, accessToken, path, raw)
}

func userDo[T any](ctx context.Context, c *Client, method, accessToken, path string, body []byte) (*T, error) {
	if c.baseURL == "" {
		return nil, ErrNotConfigured
	}
	if accessToken == "" {
		return nil, ErrNoAccessToken
	}
	var reader io.Reader
	if body != nil {
		reader = bytes.NewReader(body)
	}
	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, reader)
	if err != nil {
		return nil, fmt.Errorf("build catalog request %s: %w", path, err)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("catalog %s %s: %w", method, path, err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read catalog response: %w", err)
	}
	var env envelope[T]
	decodeErr := json.Unmarshal(raw, &env)
	if resp.StatusCode == http.StatusForbidden && isScopeDenial(env.Message) {
		return nil, ErrInsufficientScope
	}
	if decodeErr != nil {
		return nil, fmt.Errorf("decode catalog envelope: %w (status=%d)", decodeErr, resp.StatusCode)
	}
	if env.Code != 0 || resp.StatusCode != http.StatusOK {
		return nil, &APIError{Status: resp.StatusCode, Code: env.Code, Message: env.Message}
	}
	return &env.Data, nil
}

func isScopeDenial(message string) bool {
	return strings.Contains(strings.ToLower(message), "scope")
}
