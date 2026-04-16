package service

import (
	"context"
	crand "crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"kun-galgame-patch-api/internal/auth/model"
	"kun-galgame-patch-api/internal/auth/repository"
	"kun-galgame-patch-api/internal/infrastructure/mail"
	"kun-galgame-patch-api/pkg/config"

	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/argon2"
	"gorm.io/gorm"
)

type AuthService struct {
	repo     *repository.AuthRepository
	rdb      *redis.Client
	mailer   *mail.Mailer
	oauthCfg config.OAuthConfig
}

func New(repo *repository.AuthRepository, rdb *redis.Client, mailer *mail.Mailer, oauthCfg config.OAuthConfig) *AuthService {
	return &AuthService{repo: repo, rdb: rdb, mailer: mailer, oauthCfg: oauthCfg}
}

// OAuthTokenResponse OAuth token 响应
type OAuthTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

// OAuthUserInfo OAuth 用户信息
type OAuthUserInfo struct {
	Sub     string `json:"sub"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	Picture string `json:"picture"`
}

// ExchangeCode 用 authorization code 换取 token
func (s *AuthService) ExchangeCode(code, codeVerifier string) (*OAuthTokenResponse, error) {
	body := fmt.Sprintf(
		"grant_type=authorization_code&code=%s&code_verifier=%s&client_id=%s&client_secret=%s&redirect_uri=%s",
		code, codeVerifier, s.oauthCfg.ClientID, s.oauthCfg.ClientSecret, s.oauthCfg.RedirectURI,
	)

	resp, err := http.Post(
		s.oauthCfg.ServerURL+"/oauth/token",
		"application/x-www-form-urlencoded",
		strings.NewReader(body),
	)
	if err != nil {
		return nil, fmt.Errorf("OAuth token request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OAuth token request failed (%d): %s", resp.StatusCode, string(respBody))
	}

	var tokenResp OAuthTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, fmt.Errorf("failed to decode token response: %w", err)
	}

	return &tokenResp, nil
}

// GetUserInfo 通过 access token 获取 OAuth 用户信息
func (s *AuthService) GetUserInfo(accessToken string) (*OAuthUserInfo, error) {
	req, err := http.NewRequest("GET", s.oauthCfg.ServerURL+"/oauth/userinfo", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("OAuth userinfo request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OAuth userinfo request failed (%d): %s", resp.StatusCode, string(respBody))
	}

	var userInfo OAuthUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("failed to decode userinfo: %w", err)
	}

	return &userInfo, nil
}

// FindOrCreateUser 查找或创建本地用户（OAuth 登录核心逻辑）
func (s *AuthService) FindOrCreateUser(oauthUser *OAuthUserInfo) (*model.User, error) {
	// 1. 用 sub 查 oauth_account
	account, err := s.repo.FindOAuthAccountBySub(oauthUser.Sub)
	if err == nil {
		user, err := s.repo.FindUserByID(account.UserID)
		if err != nil {
			return nil, err
		}
		if user.Status == 2 {
			return nil, fmt.Errorf("该账号已被封禁")
		}
		return user, nil
	}

	// 2. 用 email 查 user（老用户迁移）
	user, err := s.repo.FindUserByEmail(oauthUser.Email)
	if err == nil {
		// 老用户，创建 oauth_account 关联
		if user.Status == 2 {
			return nil, fmt.Errorf("该账号已被封禁")
		}
		oauthAccount := &model.OAuthAccount{
			UserID:   user.ID,
			Provider: "kun-oauth",
			Sub:      oauthUser.Sub,
		}
		if err := s.repo.CreateOAuthAccount(oauthAccount); err != nil {
			slog.Error("failed to create OAuth account for existing user", "error", err, "userId", user.ID)
			return nil, fmt.Errorf("关联 OAuth 账号失败")
		}
		slog.Info("Linked OAuth account to existing user", "userId", user.ID, "sub", oauthUser.Sub)
		return user, nil
	}

	if err != gorm.ErrRecordNotFound {
		return nil, err
	}

	// 3. 全新用户
	newUser := &model.User{
		Name:   oauthUser.Name,
		Email:  oauthUser.Email,
		Avatar: oauthUser.Picture,
		Role:   1,
		Status: 0,
	}
	if err := s.repo.CreateUser(newUser); err != nil {
		return nil, fmt.Errorf("创建用户失败: %w", err)
	}

	oauthAccount := &model.OAuthAccount{
		UserID:   newUser.ID,
		Provider: "kun-oauth",
		Sub:      oauthUser.Sub,
	}
	if err := s.repo.CreateOAuthAccount(oauthAccount); err != nil {
		return nil, fmt.Errorf("创建 OAuth 关联失败: %w", err)
	}

	slog.Info("Created new user via OAuth", "userId", newUser.ID, "sub", oauthUser.Sub)
	return newUser, nil
}

// RevokeOAuthToken 吊销 OAuth token
func (s *AuthService) RevokeOAuthToken(accessToken string) {
	body := fmt.Sprintf("token=%s&client_id=%s&client_secret=%s",
		accessToken, s.oauthCfg.ClientID, s.oauthCfg.ClientSecret)

	resp, err := http.Post(
		s.oauthCfg.ServerURL+"/oauth/revoke",
		"application/x-www-form-urlencoded",
		strings.NewReader(body),
	)
	if err != nil {
		slog.Error("OAuth revoke failed", "error", err)
		return
	}
	resp.Body.Close()
}

// SendVerificationCode 发送邮箱验证码
func (s *AuthService) SendVerificationCode(email string) error {
	ctx := context.Background()

	// 检查发送频率
	rateLimitKey := "sendCode:email:" + email
	if exists, _ := s.rdb.Exists(ctx, rateLimitKey).Result(); exists > 0 {
		return fmt.Errorf("验证码发送过于频繁，请 60 秒后再试")
	}

	code := fmt.Sprintf("%06d", rand.Intn(1000000))
	codeKey := "verificationCode:" + email

	s.rdb.Set(ctx, codeKey, code, 10*time.Minute)
	s.rdb.Set(ctx, rateLimitKey, 1, 60*time.Second)

	subject := "KUN 视觉小说补丁 - 验证码"
	body := fmt.Sprintf(`<p>您的验证码是: <strong>%s</strong></p><p>有效期 10 分钟，请勿泄露给他人。</p>`, code)

	return s.mailer.Send(email, subject, body)
}

// VerifyCode 验证邮箱验证码
func (s *AuthService) VerifyCode(email, code string) error {
	ctx := context.Background()
	codeKey := "verificationCode:" + email

	storedCode, err := s.rdb.Get(ctx, codeKey).Result()
	if err == redis.Nil {
		return fmt.Errorf("验证码不存在或已过期")
	}
	if err != nil {
		return fmt.Errorf("验证码校验失败")
	}

	if storedCode != code {
		return fmt.Errorf("验证码错误")
	}

	s.rdb.Del(ctx, codeKey)
	return nil
}

// HashPassword 使用 Argon2id 哈希密码
func (s *AuthService) HashPassword(password string) string {
	salt := make([]byte, 16)
	crand.Read(salt)
	hash := argon2.IDKey([]byte(password), salt, 2, 8192, 3, 32)
	return fmt.Sprintf("%x:%x", salt, hash)
}

// VerifyPassword 验证密码
func (s *AuthService) VerifyPassword(hashedPassword, password string) bool {
	parts := strings.SplitN(hashedPassword, ":", 2)
	if len(parts) != 2 {
		return false
	}

	salt, _ := hexDecode(parts[0])
	expectedHash, _ := hexDecode(parts[1])
	if salt == nil || expectedHash == nil {
		return false
	}

	hash := argon2.IDKey([]byte(password), salt, 2, 8192, 3, 32)

	if len(hash) != len(expectedHash) {
		return false
	}
	for i := range hash {
		if hash[i] != expectedHash[i] {
			return false
		}
	}
	return true
}

func hexDecode(s string) ([]byte, error) {
	b := make([]byte, len(s)/2)
	for i := 0; i < len(s); i += 2 {
		var val byte
		for j := 0; j < 2; j++ {
			c := s[i+j]
			switch {
			case c >= '0' && c <= '9':
				val = val*16 + (c - '0')
			case c >= 'a' && c <= 'f':
				val = val*16 + (c - 'a' + 10)
			case c >= 'A' && c <= 'F':
				val = val*16 + (c - 'A' + 10)
			default:
				return nil, fmt.Errorf("invalid hex char: %c", c)
			}
		}
		b[i/2] = val
	}
	return b, nil
}
