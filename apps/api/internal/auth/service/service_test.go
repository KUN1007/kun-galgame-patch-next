package service_test

import (
	"testing"

	"kun-galgame-patch-api/internal/auth/service"
	"kun-galgame-patch-api/pkg/config"

	"github.com/stretchr/testify/assert"
)

func newTestService() *service.AuthService {
	return service.New(nil, nil, nil, config.OAuthConfig{})
}

func TestHashPassword_And_VerifyPassword(t *testing.T) {
	svc := newTestService()

	password := "MySecret123!"
	hash := svc.HashPassword(password)

	assert.NotEmpty(t, hash)
	assert.Contains(t, hash, ":")
	assert.True(t, svc.VerifyPassword(hash, password))
}

func TestVerifyPassword_WrongPassword(t *testing.T) {
	svc := newTestService()

	hash := svc.HashPassword("correct-password")
	assert.False(t, svc.VerifyPassword(hash, "wrong-password"))
}

func TestVerifyPassword_InvalidHash(t *testing.T) {
	svc := newTestService()

	assert.False(t, svc.VerifyPassword("invalid", "password"))
	assert.False(t, svc.VerifyPassword("", "password"))
	assert.False(t, svc.VerifyPassword("nocolon", "password"))
}

func TestHashPassword_Unique(t *testing.T) {
	svc := newTestService()

	// Same password should produce different hashes (random salt)
	h1 := svc.HashPassword("same-password")
	h2 := svc.HashPassword("same-password")
	assert.NotEqual(t, h1, h2)

	// But both should verify
	assert.True(t, svc.VerifyPassword(h1, "same-password"))
	assert.True(t, svc.VerifyPassword(h2, "same-password"))
}
