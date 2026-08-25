package handler

import (
	"errors"
	"testing"

	"kun-galgame-patch-api/pkg/catalogv2"
)

func TestCatalogWriteFallback(t *testing.T) {
	if !catalogWriteFallback(catalogv2.ErrNotFound) {
		t.Fatal("not found")
	}
	if !catalogWriteFallback(&catalogv2.Problem{Status: 422, Code: "VALIDATION_FAILED"}) {
		t.Fatal("preview PATCH live is 422")
	}
	if catalogWriteFallback(&catalogv2.Problem{Status: 409, Code: "INVALID_STATE_TRANSITION"}) {
		t.Fatal("a real illegal transition must not fall back")
	}
	if catalogWriteFallback(errors.New("network")) {
		t.Fatal("unrelated")
	}
}
