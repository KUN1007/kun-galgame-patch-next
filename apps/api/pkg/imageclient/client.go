package imageclient

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"path/filepath"
	"strings"
	"time"
)

var (
	ErrQuotaExceeded      = errors.New("image_service: daily upload quota exceeded")
	ErrModerationRejected = errors.New("image_service: image rejected by moderation")
	ErrUnauthorized       = errors.New("image_service: unauthorized (check client_id/secret + image_enabled)")
)

type Config struct {
	BaseURL      string
	CDNBase      string
	ClientID     string
	ClientSecret string
	HTTPClient   *http.Client
}

type Client struct {
	baseURL    string
	cdnBase    string
	basicAuth  string
	httpClient *http.Client
}

func New(cfg Config) *Client {
	hc := cfg.HTTPClient
	if hc == nil {
		hc = &http.Client{Timeout: 30 * time.Second}
	}
	var ba string
	if cfg.ClientID != "" && cfg.ClientSecret != "" {
		ba = "Basic " + base64.StdEncoding.EncodeToString(
			[]byte(cfg.ClientID+":"+cfg.ClientSecret),
		)
	}
	return &Client{
		baseURL:    strings.TrimRight(cfg.BaseURL, "/"),
		cdnBase:    strings.TrimRight(cfg.CDNBase, "/"),
		basicAuth:  ba,
		httpClient: hc,
	}
}

type UploadResult struct {
	Hash         string            `json:"hash"`
	URL          string            `json:"url"`
	VariantURLs  map[string]string `json:"variant_urls"`
	Width        int               `json:"width"`
	Height       int               `json:"height"`
	Thumbhash    string            `json:"thumbhash,omitempty"`
	SizeBytes    int64             `json:"size_bytes"`
	Deduplicated bool              `json:"deduplicated"`
}

func (c *Client) Upload(
	ctx context.Context,
	body io.Reader, filename, mime, preset string,
) (*UploadResult, error) {
	if c.baseURL == "" {
		return nil, errors.New("image_service: client not configured (KUN_IMAGE_SERVICE_BASE_URL unset)")
	}
	if c.basicAuth == "" {
		return nil, ErrUnauthorized
	}
	if filename == "" {
		filename = "upload.bin"
	}

	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	if err := w.WriteField("preset", preset); err != nil {
		return nil, fmt.Errorf("write preset field: %w", err)
	}
	h := textproto.MIMEHeader{}
	h.Set("Content-Disposition",
		fmt.Sprintf(`form-data; name="file"; filename=%q`, filepath.Base(filename)))
	if mime != "" {
		h.Set("Content-Type", mime)
	}
	fw, err := w.CreatePart(h)
	if err != nil {
		return nil, fmt.Errorf("create file part: %w", err)
	}
	if _, err := io.Copy(fw, body); err != nil {
		return nil, fmt.Errorf("copy file body: %w", err)
	}
	if err := w.Close(); err != nil {
		return nil, fmt.Errorf("close multipart: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/image/upload", &buf)
	if err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Authorization", c.basicAuth)
	req.Header.Set("Content-Type", w.FormDataContentType())
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("image_service POST /image/upload: %w", err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)

	if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusCreated {
		var env struct {
			Code int          `json:"code"`
			Data UploadResult `json:"data"`
		}
		if err := json.Unmarshal(raw, &env); err != nil {
			return nil, fmt.Errorf("decode upload response: %w (body=%s)", err, truncate(string(raw), 200))
		}
		out := env.Data
		if out.VariantURLs == nil {
			out.VariantURLs = map[string]string{}
		}
		return &out, nil
	}

	var env struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	}
	_ = json.Unmarshal(raw, &env)

	switch env.Code {
	case 80008:
		return nil, fmt.Errorf("%w: %s", ErrQuotaExceeded, env.Message)
	case 60002:
		return nil, fmt.Errorf("%w: %s", ErrModerationRejected, env.Message)
	case 80001, 80002, 80003, 80004, 80005, 80006, 80015:
		return nil, fmt.Errorf("%w: %s", ErrUnauthorized, env.Message)
	}
	return nil, fmt.Errorf("image_service upload failed: status=%d code=%d msg=%q",
		resp.StatusCode, env.Code, env.Message)
}

func (c *Client) Configured() bool { return c.baseURL != "" && c.basicAuth != "" }

type ReferencePingResult struct {
	Updated  int64    `json:"updated"`
	NotFound []string `json:"not_found"`
}

func (c *Client) ReferencePing(ctx context.Context, hashes []string) (*ReferencePingResult, error) {
	if len(hashes) == 0 {
		return &ReferencePingResult{}, nil
	}
	if c.baseURL == "" {
		return nil, errors.New("image_service: client not configured (KUN_IMAGE_SERVICE_BASE_URL unset)")
	}
	if c.basicAuth == "" {
		return nil, ErrUnauthorized
	}
	if len(hashes) > 1000 {
		return nil, fmt.Errorf("imageclient: batch size %d exceeds limit 1000", len(hashes))
	}

	body, _ := json.Marshal(struct {
		Hashes []string `json:"hashes"`
	}{Hashes: hashes})

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/image/reference-ping", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Authorization", c.basicAuth)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("image_service POST /image/reference-ping: %w", err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		var env struct {
			Code    int    `json:"code"`
			Message string `json:"message"`
		}
		_ = json.Unmarshal(raw, &env)
		switch env.Code {
		case 80001, 80002, 80003, 80004, 80005:
			return nil, fmt.Errorf("%w: %s", ErrUnauthorized, env.Message)
		}
		return nil, fmt.Errorf("image_service reference-ping failed: status=%d code=%d msg=%q",
			resp.StatusCode, env.Code, env.Message)
	}

	var env struct {
		Data ReferencePingResult `json:"data"`
	}
	if err := json.Unmarshal(raw, &env); err != nil {
		return nil, fmt.Errorf("decode reference-ping response: %w (body=%s)", err, truncate(string(raw), 200))
	}
	return &env.Data, nil
}

type ImageMeta struct {
	Width     int    `json:"width"`
	Height    int    `json:"height"`
	Thumbhash string `json:"thumbhash,omitempty"`
}

func (c *Client) MetaBatch(ctx context.Context, hashes []string) (map[string]ImageMeta, error) {
	if len(hashes) == 0 {
		return map[string]ImageMeta{}, nil
	}
	if c.baseURL == "" {
		return nil, errors.New("image_service: client not configured (KUN_IMAGE_SERVICE_BASE_URL unset)")
	}
	if c.basicAuth == "" {
		return nil, ErrUnauthorized
	}
	if len(hashes) > 1000 {
		return nil, fmt.Errorf("imageclient: batch size %d exceeds limit 1000", len(hashes))
	}

	body, _ := json.Marshal(struct {
		Hashes []string `json:"hashes"`
	}{Hashes: hashes})

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/image/meta-batch", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Authorization", c.basicAuth)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("image_service POST /image/meta-batch: %w", err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		var env struct {
			Code    int    `json:"code"`
			Message string `json:"message"`
		}
		_ = json.Unmarshal(raw, &env)
		switch env.Code {
		case 80001, 80002, 80003, 80004, 80005:
			return nil, fmt.Errorf("%w: %s", ErrUnauthorized, env.Message)
		}
		return nil, fmt.Errorf("image_service meta-batch failed: status=%d code=%d msg=%q",
			resp.StatusCode, env.Code, env.Message)
	}

	var env struct {
		Data struct {
			Metas map[string]ImageMeta `json:"metas"`
		} `json:"data"`
	}
	if err := json.Unmarshal(raw, &env); err != nil {
		return nil, fmt.Errorf("decode meta-batch response: %w (body=%s)", err, truncate(string(raw), 200))
	}
	if env.Data.Metas == nil {
		return map[string]ImageMeta{}, nil
	}
	return env.Data.Metas, nil
}

func (c *Client) MainURL(hash string) string {
	return c.variantPath(hash, "")
}

func (c *Client) VariantURL(hash, variant string) string {
	return c.variantPath(hash, variant)
}

func (c *Client) variantPath(hash, variant string) string {
	if len(hash) < 4 || !isHex(hash) {
		return ""
	}
	suffix := ""
	if variant != "" {
		suffix = "_" + variant
	}
	return fmt.Sprintf("%s/%s/%s/%s%s.webp",
		c.cdnBase, hash[:2], hash[2:4], hash, suffix)
}

func isHex(s string) bool {
	for i := 0; i < len(s); i++ {
		c := s[i]
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
			return false
		}
	}
	return true
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}
