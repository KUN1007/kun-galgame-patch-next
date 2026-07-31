// Package catalogclient is a thin SDK for the catalog service's S2S face
// (kun-galgame-infra, port 9281, under /api/v1/catalog).
//
// It is deliberately separate from internal/galgame/client, which speaks the
// PUBLIC /v1 face with an internal-tier X-API-Key. This face is a different
// channel with a different credential: HTTP Basic with moyu's OAuth
// client_id/secret, because the catalog reads oauth_clients to decide what a
// caller may do (the per-client `catalog_site` binding gates every write). Only
// the reads moyu needs live here; the house {code,message,data} envelope is the
// same one every other infra service answers with.
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

// Claim states — the registry's public claim vocabulary (`claimed_by.state`),
// which replaced the wiki's `status` integers. Eternal wire values.
//
// It is a RESHAPE and not a rename: the wiki's status 2 (unclaimed VNDB draft)
// and status 3 (submitted, awaiting review) both projected onto `draft`, and
// `hidden` is a state the wiki expressed as a deleted row.
const (
	ClaimStateNone     = "none"
	ClaimStateLive     = "live"
	ClaimStateDraft    = "draft"
	ClaimStatePending  = "pending"
	ClaimStateDeclined = "declined"
	ClaimStateHidden   = "hidden"
)

// Config bundles connection settings (created in app.go from config). The Basic
// credentials are moyu's OAuth client_id/secret.
type Config struct {
	BaseURL      string // catalog host base, e.g. http://127.0.0.1:19281 (no /api suffix)
	ClientID     string
	ClientSecret string
	HTTPClient   *http.Client // optional; defaults to a 15s-timeout client
}

// Client is a thin wrapper over the catalog S2S HTTP API.
type Client struct {
	basicAuth  string
	baseURL    string
	httpClient *http.Client
}

// New constructs a Client. Empty BaseURL/credentials = a client whose calls
// return ErrNotConfigured; callers check Configured() and skip rather than
// erroring every tick on a dev box with no catalog.
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

// Configured reports whether the client can reach the catalog S2S face.
func (c *Client) Configured() bool { return c.baseURL != "" && c.basicAuth != "" }

// ErrNotConfigured is returned rather than dialling a base URL that is not set.
var ErrNotConfigured = errors.New("catalogclient: not configured (empty base URL or credentials)")

// APIError is a non-zero envelope code, carrying the HTTP status beside it. The
// two together are what separate "the catalog refused this request" from "the
// request never reached the catalog" — a router or proxy 404 echoes the status
// into `code`, so neither half is conclusive alone.
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
