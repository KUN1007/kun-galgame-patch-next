package middleware_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"kun-galgame-patch-api/internal/middleware"
	"kun-galgame-patch-api/internal/testutil"
	"kun-galgame-patch-api/pkg/config"
	"kun-galgame-patch-api/pkg/response"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAuth_NoSession(t *testing.T) {
	ta := testutil.NewTestApp(t)
	oauthCfg := config.OAuthConfig{}

	ta.App.Get("/protected", middleware.Auth(ta.RDB, oauthCfg), func(c *fiber.Ctx) error {
		return c.JSON(response.Response{Code: 0, Message: "OK"})
	})

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	resp, err := ta.App.Test(req, -1)
	require.NoError(t, err)
	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)

	r := testutil.ParseResponse(t, resp)
	assert.Equal(t, 40100, r.Code)
}

func TestAuth_ValidSession(t *testing.T) {
	ta := testutil.NewTestApp(t)
	oauthCfg := config.OAuthConfig{}

	ta.App.Get("/protected", middleware.Auth(ta.RDB, oauthCfg), func(c *fiber.Ctx) error {
		user := middleware.MustGetUser(c)
		return c.JSON(response.Response{Code: 0, Message: "OK", Data: user.UID})
	})

	sessionID := ta.CreateTestSession(t, 1, 1)
	resp := ta.Request(t, http.MethodGet, "/protected", "", sessionID)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	r := testutil.ParseResponse(t, resp)
	assert.Equal(t, 0, r.Code)
}

func TestAuth_ExpiredSession(t *testing.T) {
	ta := testutil.NewTestApp(t)
	oauthCfg := config.OAuthConfig{}

	ta.App.Get("/protected", middleware.Auth(ta.RDB, oauthCfg), func(c *fiber.Ctx) error {
		return c.JSON(response.Response{Code: 0, Message: "OK"})
	})

	// Use a session ID that doesn't exist in Redis
	resp := ta.Request(t, http.MethodGet, "/protected", "", "nonexistent-session")
	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)

	r := testutil.ParseResponse(t, resp)
	assert.Equal(t, 40101, r.Code)
}

func TestOptionalAuth_NoSession(t *testing.T) {
	ta := testutil.NewTestApp(t)
	oauthCfg := config.OAuthConfig{}

	ta.App.Get("/optional", middleware.OptionalAuth(ta.RDB, oauthCfg), func(c *fiber.Ctx) error {
		uid := middleware.GetUID(c)
		return c.JSON(response.Response{Code: 0, Data: uid})
	})

	req := httptest.NewRequest(http.MethodGet, "/optional", nil)
	resp, err := ta.App.Test(req, -1)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	r := testutil.ParseResponse(t, resp)
	assert.Equal(t, 0, r.Code)
	// Data should be 0 (no user)
	assert.Equal(t, float64(0), r.Data)
}

func TestOptionalAuth_ValidSession(t *testing.T) {
	ta := testutil.NewTestApp(t)
	oauthCfg := config.OAuthConfig{}

	ta.App.Get("/optional", middleware.OptionalAuth(ta.RDB, oauthCfg), func(c *fiber.Ctx) error {
		uid := middleware.GetUID(c)
		return c.JSON(response.Response{Code: 0, Data: uid})
	})

	sessionID := ta.CreateTestSession(t, 42, 2)
	resp := ta.Request(t, http.MethodGet, "/optional", "", sessionID)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	r := testutil.ParseResponse(t, resp)
	assert.Equal(t, float64(42), r.Data)
}

func TestRequireRole_InsufficientRole(t *testing.T) {
	ta := testutil.NewTestApp(t)
	oauthCfg := config.OAuthConfig{}

	ta.App.Get("/admin",
		middleware.Auth(ta.RDB, oauthCfg),
		middleware.RequireRole(3),
		func(c *fiber.Ctx) error {
			return c.JSON(response.Response{Code: 0, Message: "admin"})
		},
	)

	// User with role 1 (normal user)
	sessionID := ta.CreateTestSession(t, 1, 1)
	resp := ta.Request(t, http.MethodGet, "/admin", "", sessionID)
	assert.Equal(t, http.StatusForbidden, resp.StatusCode)

	r := testutil.ParseResponse(t, resp)
	assert.Equal(t, 40300, r.Code)
}

func TestRequireRole_SufficientRole(t *testing.T) {
	ta := testutil.NewTestApp(t)
	oauthCfg := config.OAuthConfig{}

	ta.App.Get("/admin",
		middleware.Auth(ta.RDB, oauthCfg),
		middleware.RequireRole(3),
		func(c *fiber.Ctx) error {
			return c.JSON(response.Response{Code: 0, Message: "admin"})
		},
	)

	sessionID := ta.CreateTestSession(t, 1, 3)
	resp := ta.Request(t, http.MethodGet, "/admin", "", sessionID)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	r := testutil.ParseResponse(t, resp)
	assert.Equal(t, 0, r.Code)
}

func TestCreateSession_And_DestroySession(t *testing.T) {
	ta := testutil.NewTestApp(t)

	var capturedCookie string

	ta.App.Post("/login", func(c *fiber.Ctx) error {
		session := &middleware.SessionData{
			UserInfo: middleware.UserInfo{UID: 99, Name: "test", Role: 1},
		}
		return middleware.CreateSession(c, ta.RDB, session)
	})

	ta.App.Post("/logout", func(c *fiber.Ctx) error {
		return middleware.DestroySession(c, ta.RDB)
	})

	// Login
	req := httptest.NewRequest(http.MethodPost, "/login", nil)
	resp, err := ta.App.Test(req, -1)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	// Extract session cookie
	for _, cookie := range resp.Cookies() {
		if cookie.Name == middleware.SessionCookieName {
			capturedCookie = cookie.Value
		}
	}
	assert.NotEmpty(t, capturedCookie)

	// Verify session exists in Redis
	val, err := ta.RDB.Get(context.Background(), middleware.SessionPrefix+capturedCookie).Result()
	require.NoError(t, err)
	assert.NotEmpty(t, val)

	var session middleware.SessionData
	json.Unmarshal([]byte(val), &session)
	assert.Equal(t, 99, session.UID)

	// Logout
	logoutReq := httptest.NewRequest(http.MethodPost, "/logout", nil)
	logoutReq.AddCookie(&http.Cookie{Name: middleware.SessionCookieName, Value: capturedCookie})
	logoutResp, err := ta.App.Test(logoutReq, -1)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, logoutResp.StatusCode)

	// Verify session removed from Redis
	_, err = ta.RDB.Get(context.Background(), middleware.SessionPrefix+capturedCookie).Result()
	assert.Error(t, err) // should be redis.Nil
}

func TestGetUser_Helpers(t *testing.T) {
	ta := testutil.NewTestApp(t)
	oauthCfg := config.OAuthConfig{}

	ta.App.Get("/helpers", middleware.Auth(ta.RDB, oauthCfg), func(c *fiber.Ctx) error {
		user := middleware.GetUser(c)
		must := middleware.MustGetUser(c)
		uid := middleware.GetUID(c)
		role := middleware.GetRole(c)

		return c.JSON(map[string]any{
			"user_nil": user == nil,
			"must_nil": must == nil,
			"uid":      uid,
			"role":     role,
			"name":     user.Name,
		})
	})

	sessionID := ta.CreateTestSession(t, 7, 2)
	resp := ta.Request(t, http.MethodGet, "/helpers", "", sessionID)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := testutil.ReadBody(t, resp)
	var result map[string]any
	json.Unmarshal([]byte(body), &result)
	assert.Equal(t, false, result["user_nil"])
	assert.Equal(t, false, result["must_nil"])
	assert.Equal(t, float64(7), result["uid"])
	assert.Equal(t, float64(2), result["role"])
	assert.Equal(t, "user7", result["name"])
}
