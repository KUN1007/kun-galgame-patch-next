package catalogclient

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	ClaimStateNone     = "none"
	ClaimStateLive     = "live"
	ClaimStateDraft    = "draft"
	ClaimStatePending  = "pending"
	ClaimStateDeclined = "declined"
	ClaimStateHidden   = "hidden"
)

const (
	ClaimSiteKungal = "kungal"
	claimSiteLegacy = "galgame_wiki"
)

func IsGIDClaimSite(site string) bool {
	return site == ClaimSiteKungal || site == claimSiteLegacy
}

type Config struct {
	BaseURL      string
	ClientID     string
	ClientSecret string
	HTTPClient   *http.Client
}

type Client struct {
	basicAuth  string
	baseURL    string
	httpClient *http.Client
}

func New(cfg Config) *Client {
	hc := cfg.HTTPClient
	if hc == nil {
		hc = &http.Client{Timeout: 15 * time.Second}
	}
	var ba string
	if cfg.ClientID != "" && cfg.ClientSecret != "" {
		ba = "Basic " + base64.StdEncoding.EncodeToString([]byte(cfg.ClientID+":"+cfg.ClientSecret))
	}
	return &Client{
		basicAuth:  ba,
		baseURL:    strings.TrimRight(cfg.BaseURL, "/"),
		httpClient: hc,
	}
}

func (c *Client) Configured() bool { return c.baseURL != "" && c.basicAuth != "" }

var ErrNotConfigured = errors.New("catalogclient: not configured (empty base URL or credentials)")

type APIError struct {
	Status  int
	Code    int
	Message string
}

func (e *APIError) Error() string {
	return fmt.Sprintf("catalog s2s error status=%d code=%d: %s", e.Status, e.Code, e.Message)
}

type envelope[T any] struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    T      `json:"data"`
}

func getQuery[T any](ctx context.Context, c *Client, path string, q url.Values) (*T, error) {
	if !c.Configured() {
		return nil, ErrNotConfigured
	}
	u := c.baseURL + path
	if len(q) > 0 {
		u += "?" + q.Encode()
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, fmt.Errorf("build catalog request %s: %w", path, err)
	}
	req.Header.Set("Authorization", c.basicAuth)
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("catalog GET %s: %w", path, err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read catalog response: %w", err)
	}
	var env envelope[T]
	if err := json.Unmarshal(raw, &env); err != nil {
		return nil, fmt.Errorf("decode catalog envelope: %w (status=%d)", err, resp.StatusCode)
	}
	if env.Code != 0 {
		return nil, &APIError{Status: resp.StatusCode, Code: env.Code, Message: env.Message}
	}
	return &env.Data, nil
}
