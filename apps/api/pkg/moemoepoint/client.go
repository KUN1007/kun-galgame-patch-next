package moemoepoint

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

const defaultTimeout = 5 * time.Second

type Config struct {
	BaseURL      string
	ClientID     string
	ClientSecret string
	HTTPClient   *http.Client
}

type Client struct {
	baseURL    string
	authHeader string
	clientID   string
	http       *http.Client
}

func New(cfg Config) *Client {
	if cfg.HTTPClient == nil {
		cfg.HTTPClient = &http.Client{Timeout: defaultTimeout}
	}
	creds := cfg.ClientID + ":" + cfg.ClientSecret
	return &Client{
		baseURL:    strings.TrimRight(cfg.BaseURL, "/"),
		authHeader: "Basic " + base64.StdEncoding.EncodeToString([]byte(creds)),
		clientID:   cfg.ClientID,
		http:       cfg.HTTPClient,
	}
}

type AdjustRequest struct {
	Delta          int    `json:"delta"`
	Reason         string `json:"reason"`
	Ref            string `json:"ref,omitempty"`
	ActorUserID    int    `json:"actor_user_id"`
	IdempotencyKey string `json:"idempotency_key"`
	Note           string `json:"note,omitempty"`
}

type AdjustResult struct {
	UserID  int  `json:"user_id"`
	Balance int  `json:"balance"`
	Applied bool `json:"applied"`
}

func (c *Client) Adjust(ctx context.Context, userID int, r AdjustRequest) (*AdjustResult, error) {
	body, err := json.Marshal(r)
	if err != nil {
		return nil, err
	}
	u := fmt.Sprintf("%s/users/%d/moemoepoint", c.baseURL, userID)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, u, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", c.authHeader)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("oauth moemoepoint adjust: %w", err)
	}
	defer resp.Body.Close()

	var env struct {
		Code    int          `json:"code"`
		Message string       `json:"message"`
		Data    AdjustResult `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&env); err != nil {
		return nil, fmt.Errorf("oauth moemoepoint adjust decode (status=%d): %w", resp.StatusCode, err)
	}
	if env.Code != 0 {
		return nil, fmt.Errorf("oauth moemoepoint adjust: code=%d msg=%s", env.Code, env.Message)
	}
	return &env.Data, nil
}

func (c *Client) Balance(ctx context.Context, userID int) (int, error) {
	u := fmt.Sprintf("%s/users/%d/moemoepoint", c.baseURL, userID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return 0, err
	}
	req.Header.Set("Authorization", c.authHeader)
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return 0, fmt.Errorf("oauth moemoepoint balance: %w", err)
	}
	defer resp.Body.Close()

	var env struct {
		Code int `json:"code"`
		Data struct {
			Balance int `json:"balance"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&env); err != nil {
		return 0, fmt.Errorf("oauth moemoepoint balance decode (status=%d): %w", resp.StatusCode, err)
	}
	if env.Code != 0 {
		return 0, fmt.Errorf("oauth moemoepoint balance: code=%d", env.Code)
	}
	return env.Data.Balance, nil
}

type LogEntry struct {
	ID        int64  `json:"id"`
	Delta     int    `json:"delta"`
	Reason    string `json:"reason"`
	SourceApp string `json:"source_app"`
	Ref       string `json:"ref"`
	CreatedAt string `json:"created_at"`
	IsLocal   bool   `json:"is_local"`
	Link      string `json:"link"`
}

func (c *Client) Log(ctx context.Context, userID, limit int, beforeID int64, reason string) ([]LogEntry, bool, error) {
	q := url.Values{}
	if limit > 0 {
		q.Set("limit", strconv.Itoa(limit))
	}
	if beforeID > 0 {
		q.Set("before_id", strconv.FormatInt(beforeID, 10))
	}
	if reason != "" {
		q.Set("reason", reason)
	}
	u := fmt.Sprintf("%s/users/%d/moemoepoint/log", c.baseURL, userID)
	if enc := q.Encode(); enc != "" {
		u += "?" + enc
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, false, err
	}
	req.Header.Set("Authorization", c.authHeader)
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, false, fmt.Errorf("oauth moemoepoint log: %w", err)
	}
	defer resp.Body.Close()

	var env struct {
		Code int `json:"code"`
		Data struct {
			Items   []LogEntry `json:"items"`
			HasMore bool       `json:"has_more"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&env); err != nil {
		return nil, false, fmt.Errorf("oauth moemoepoint log decode (status=%d): %w", resp.StatusCode, err)
	}
	if env.Code != 0 {
		return nil, false, fmt.Errorf("oauth moemoepoint log: code=%d", env.Code)
	}
	if env.Data.Items == nil {
		env.Data.Items = []LogEntry{}
	}
	for i := range env.Data.Items {
		env.Data.Items[i].IsLocal = env.Data.Items[i].SourceApp == c.clientID
	}
	return env.Data.Items, env.Data.HasMore, nil
}
