package middleware

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	stderrors "errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"slices"
	"strings"
	"time"

	"kun-galgame-patch-api/pkg/config"
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/response"

	"bytes"

	"github.com/gofiber/fiber/v3"
	"github.com/redis/go-redis/v9"
)

type UserInfo struct {
	ID  int    `json:"id"`
	Sub string `json:"sub"`
}

type SessionData struct {
	UserInfo
	OAuthAccessToken  string `json:"oauth_access_token"`
	OAuthRefreshToken string `json:"oauth_refresh_token"`
	OAuthExpiresAt    int64  `json:"oauth_expires_at"`
}

const (
	SessionCookieName     = "moyu_session"
	SessionTTL            = 90 * 24 * time.Hour
	SessionPrefix         = "moyu:session:"
	sessionRenewPrefix    = "moyu:session-renew:"
	userContextKey        = "user"
	rolesContextKey       = "oauth_roles"
	siteRolesContextKey   = "oauth_site_roles"
	accessTokenContextKey = "oauth_access_token"
)

func RevokeUserSessions(ctx context.Context, rdb *redis.Client, userID int) (int, error) {
	var (
		cursor  uint64
		deleted int
	)
	for {
		keys, next, err := rdb.Scan(ctx, cursor, SessionPrefix+"*", 200).Result()
		if err != nil {
			return deleted, err
		}
		for _, key := range keys {
			val, gerr := rdb.Get(ctx, key).Result()
			if gerr != nil {
				continue
			}
			var s SessionData
			if json.Unmarshal([]byte(val), &s) != nil {
				continue
			}
			if s.ID == userID {
				if rdb.Del(ctx, key).Err() == nil {
					deleted++
				}
			}
		}
		cursor = next
		if cursor == 0 {
			break
		}
	}
	return deleted, nil
}

func Auth(rdb *redis.Client, oauthCfg config.OAuthConfig) fiber.Handler {
	return func(c fiber.Ctx) error {
		sessionID := c.Cookies(SessionCookieName)
		if sessionID == "" {
			return response.Error(c, errors.ErrUnauthorized())
		}

		ctx := c.Context()
		data, err := rdb.Get(ctx, SessionPrefix+sessionID).Result()
		if err == redis.Nil {
			return response.Error(c, errors.ErrAuthExpired())
		}
		if err != nil {
			slog.Error("Redis get session failed", "error", err)
			return response.Error(c, errors.ErrInternal(""))
		}

		var session SessionData
		if err := json.Unmarshal([]byte(data), &session); err != nil {
			return response.Error(c, errors.ErrInternal(""))
		}

		now := time.Now().Unix()
		if session.OAuthExpiresAt > 0 && now >= session.OAuthExpiresAt {
			if err := refreshOAuthToken(ctx, rdb, oauthCfg, sessionID, &session); err != nil {
				if stderrors.Is(err, errRefreshLockContended) &&
					waitForRefreshedSession(ctx, rdb, sessionID, &session) {
				} else {
					slog.Warn("OAuth access token expired and refresh failed; rejecting request",
						"sessionPrefix", sessionID[:min(8, len(sessionID))], "error", err)
					if exists, _ := rdb.Exists(ctx, SessionPrefix+sessionID).Result(); exists == 0 {
						clearSessionCookie(c)
					}
					return response.Error(c, errors.ErrAuthExpired())
				}
			}
		} else if session.OAuthExpiresAt > 0 && now >= session.OAuthExpiresAt-300 {
			go func(s SessionData) {
				if err := refreshOAuthToken(context.Background(), rdb, oauthCfg, sessionID, &s); err != nil {
					slog.Warn("OAuth background refresh failed", "error", err)
				}
			}(session)
		}

		renewSlidingSession(c, rdb, sessionID)

		roles, siteRoles := decodeJWTClaims(session.OAuthAccessToken)
		c.Locals(userContextKey, &session.UserInfo)
		c.Locals(rolesContextKey, roles)
		c.Locals(siteRolesContextKey, siteRoles)
		c.Locals(accessTokenContextKey, session.OAuthAccessToken)
		return c.Next()
	}
}

func OptionalAuth(rdb *redis.Client, oauthCfg config.OAuthConfig) fiber.Handler {
	return func(c fiber.Ctx) error {
		sessionID := c.Cookies(SessionCookieName)
		if sessionID == "" {
			return c.Next()
		}

		ctx := c.Context()
		data, err := rdb.Get(ctx, SessionPrefix+sessionID).Result()
		if err != nil {
			return c.Next()
		}

		var session SessionData
		if err := json.Unmarshal([]byte(data), &session); err != nil {
			return c.Next()
		}

		now := time.Now().Unix()
		if session.OAuthExpiresAt > 0 && now >= session.OAuthExpiresAt {
			if err := refreshOAuthToken(ctx, rdb, oauthCfg, sessionID, &session); err != nil {
				if stderrors.Is(err, errRefreshLockContended) &&
					waitForRefreshedSession(ctx, rdb, sessionID, &session) {
				} else {
					if exists, _ := rdb.Exists(ctx, SessionPrefix+sessionID).Result(); exists == 0 {
						clearSessionCookie(c)
					}
					return c.Next()
				}
			}
		} else if session.OAuthExpiresAt > 0 && now >= session.OAuthExpiresAt-300 {
			go func(s SessionData) {
				if err := refreshOAuthToken(context.Background(), rdb, oauthCfg, sessionID, &s); err != nil {
					slog.Warn("OAuth background refresh failed", "error", err)
				}
			}(session)
		}

		renewSlidingSession(c, rdb, sessionID)

		roles, siteRoles := decodeJWTClaims(session.OAuthAccessToken)
		c.Locals(userContextKey, &session.UserInfo)
		c.Locals(rolesContextKey, roles)
		c.Locals(siteRolesContextKey, siteRoles)
		c.Locals(accessTokenContextKey, session.OAuthAccessToken)
		return c.Next()
	}
}

func GetUser(c fiber.Ctx) *UserInfo {
	user, ok := c.Locals(userContextKey).(*UserInfo)
	if !ok {
		return nil
	}
	return user
}

func MustGetUser(c fiber.Ctx) *UserInfo {
	return c.Locals(userContextKey).(*UserInfo)
}

func GetUserID(c fiber.Ctx) int {
	user := GetUser(c)
	if user == nil {
		return 0
	}
	return user.ID
}

func GetAccessToken(c fiber.Ctx) string {
	v, ok := c.Locals(accessTokenContextKey).(string)
	if !ok {
		return ""
	}
	return v
}

func GetRoles(c fiber.Ctx) []string {
	v, ok := c.Locals(rolesContextKey).([]string)
	if !ok {
		return nil
	}
	return v
}

func GetSiteRoles(c fiber.Ctx) []string {
	v, ok := c.Locals(siteRolesContextKey).([]string)
	if !ok {
		return nil
	}
	return v
}

func mergeRoles(a, b []string) []string {
	if len(b) == 0 {
		return a
	}
	out := append([]string(nil), a...)
	for _, r := range b {
		if !slices.Contains(out, r) {
			out = append(out, r)
		}
	}
	return out
}

func effectiveRoles(c fiber.Ctx) []string {
	return mergeRoles(GetRoles(c), GetSiteRoles(c))
}

func HasRole(c fiber.Ctx, role string) bool {
	return slices.Contains(effectiveRoles(c), role)
}

func HasAnyRole(c fiber.Ctx, roles ...string) bool {
	if len(roles) == 0 {
		return GetUser(c) != nil
	}
	have := effectiveRoles(c)
	for _, want := range roles {
		if slices.Contains(have, want) {
			return true
		}
	}
	return false
}

var (
	SuperAdminRoles = []string{"admin", "ren"}
	ModeratorRoles  = []string{"admin", "ren", "moderator"}
)

func IsAdmin(c fiber.Ctx) bool { return HasAnyRole(c, SuperAdminRoles...) }

func IsModerator(c fiber.Ctx) bool { return HasAnyRole(c, ModeratorRoles...) }

var SecureCookies = true

var oauthRefreshHTTP = &http.Client{Timeout: 10 * time.Second}

func CreateSession(c fiber.Ctx, rdb *redis.Client, session *SessionData) error {
	sessionID, err := generateSessionID()
	if err != nil {
		return err
	}

	data, err := json.Marshal(session)
	if err != nil {
		return err
	}

	if err := rdb.Set(context.Background(), SessionPrefix+sessionID, data, SessionTTL).Err(); err != nil {
		return err
	}

	c.Cookie(&fiber.Cookie{
		Name:     SessionCookieName,
		Value:    sessionID,
		MaxAge:   int(SessionTTL.Seconds()),
		HTTPOnly: true,
		Secure:   SecureCookies,
		SameSite: "Lax",
		Path:     "/",
	})

	return nil
}

func renewSlidingSession(c fiber.Ctx, rdb *redis.Client, sessionID string) {
	ctx := c.Context()
	if ok, _ := rdb.SetNX(ctx, sessionRenewPrefix+sessionID, "1", SessionTTL/2).Result(); !ok {
		return
	}
	rdb.Expire(ctx, SessionPrefix+sessionID, SessionTTL)
	c.Cookie(&fiber.Cookie{
		Name:     SessionCookieName,
		Value:    sessionID,
		MaxAge:   int(SessionTTL.Seconds()),
		HTTPOnly: true,
		Secure:   SecureCookies,
		SameSite: "Lax",
		Path:     "/",
	})
}

func DestroySession(c fiber.Ctx, rdb *redis.Client) error {
	sessionID := c.Cookies(SessionCookieName)
	if sessionID != "" {
		rdb.Del(context.Background(), SessionPrefix+sessionID)
	}

	c.Cookie(&fiber.Cookie{
		Name:     SessionCookieName,
		Value:    "",
		MaxAge:   -1,
		HTTPOnly: true,
		Secure:   SecureCookies,
		SameSite: "Lax",
		Path:     "/",
	})

	return nil
}

func generateSessionID() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func decodeJWTClaims(token string) (roles, siteRoles []string) {
	if token == "" {
		return nil, nil
	}
	parts := strings.SplitN(token, ".", 3)
	if len(parts) < 2 {
		return nil, nil
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		payload, err = base64.URLEncoding.DecodeString(parts[1])
		if err != nil {
			return nil, nil
		}
	}
	var claims struct {
		Roles     []string `json:"roles"`
		SiteRoles []string `json:"site_roles"`
	}
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil, nil
	}
	return claims.Roles, claims.SiteRoles
}

var errRefreshLockContended = stderrors.New("refresh lock contended")

func waitForRefreshedSession(ctx context.Context, rdb *redis.Client, sessionID string, session *SessionData) bool {
	prevExpiresAt := session.OAuthExpiresAt
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		time.Sleep(100 * time.Millisecond)

		data, err := rdb.Get(ctx, SessionPrefix+sessionID).Result()
		if err != nil {
			return false
		}
		var fresh SessionData
		if json.Unmarshal([]byte(data), &fresh) != nil {
			continue
		}
		if fresh.OAuthExpiresAt > prevExpiresAt {
			*session = fresh
			return true
		}
	}
	return false
}

func refreshOAuthToken(ctx context.Context, rdb *redis.Client, oauthCfg config.OAuthConfig, sessionID string, session *SessionData) error {
	lockKey := "lock:refresh:" + sessionID
	ok, err := rdb.SetArgs(ctx, lockKey, 1, redis.SetArgs{
		TTL:  30 * time.Second,
		Mode: "NX",
	}).Result()
	if err != nil || ok != "OK" {
		return errRefreshLockContended
	}
	defer rdb.Del(ctx, lockKey)

	payload, _ := json.Marshal(map[string]string{
		"grant_type":    "refresh_token",
		"refresh_token": session.OAuthRefreshToken,
		"client_id":     oauthCfg.ClientID,
		"client_secret": oauthCfg.ClientSecret,
	})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		oauthCfg.ServerURL+"/oauth/token", bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("build refresh request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := oauthRefreshHTTP.Do(req)
	if err != nil {
		return fmt.Errorf("oauth refresh transport: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var env struct {
		Error            string `json:"error"`
		ErrorDescription string `json:"error_description"`
		AccessToken      string `json:"access_token"`
		RefreshToken     string `json:"refresh_token"`
		ExpiresIn        int64  `json:"expires_in"`
	}
	_ = json.Unmarshal(respBody, &env)

	code := 0
	msg := env.ErrorDescription
	switch env.Error {
	case "invalid_grant", "unauthorized_client":
		code = 15005
	case "invalid_client":
		code = 15008
	}
	if msg == "" {
		msg = env.Error
	}

	if resp.StatusCode == http.StatusUnauthorized ||
		resp.StatusCode == http.StatusForbidden ||
		code == 10002 || code == 10003 || code == 15003 ||
		code == 10014 || code == 15005 || code == 15008 {
		slog.Warn("OAuth refresh permanently rejected; destroying session",
			"status", resp.StatusCode, "code", code, "msg", msg)
		rdb.Del(ctx, SessionPrefix+sessionID)
		return fmt.Errorf("refresh permanently rejected (status=%d code=%d)", resp.StatusCode, code)
	}
	if resp.StatusCode != 200 {
		return fmt.Errorf("oauth refresh status=%d body=%s", resp.StatusCode, truncate(string(respBody), 200))
	}
	if code != 0 {
		return fmt.Errorf("oauth refresh code=%d msg=%s", code, msg)
	}

	access, refresh, expires := env.AccessToken, env.RefreshToken, env.ExpiresIn
	if access == "" {
		return fmt.Errorf("oauth refresh returned no access_token body=%s", truncate(string(respBody), 200))
	}

	session.OAuthAccessToken = access
	session.OAuthRefreshToken = refresh
	session.OAuthExpiresAt = time.Now().Unix() + expires

	blob, _ := json.Marshal(session)
	return rdb.Set(ctx, SessionPrefix+sessionID, blob, SessionTTL).Err()
}

func clearSessionCookie(c fiber.Ctx) {
	c.Cookie(&fiber.Cookie{
		Name:     SessionCookieName,
		Value:    "",
		MaxAge:   -1,
		HTTPOnly: true,
		Secure:   SecureCookies,
		SameSite: "Lax",
		Path:     "/",
	})
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}
