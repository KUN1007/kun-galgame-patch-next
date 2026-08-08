package trustclient

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"strconv"
	"time"
)

const CallbackWindow = 5 * time.Minute

func SignPayload(secret, timestamp string, body []byte) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(timestamp))
	mac.Write([]byte("."))
	mac.Write(body)
	return hex.EncodeToString(mac.Sum(nil))
}

func VerifyCallbackSignature(secret, timestamp, signature string, body []byte, now time.Time) bool {
	if secret == "" || timestamp == "" || signature == "" {
		return false
	}
	ts, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		return false
	}
	skew := now.Sub(time.Unix(ts, 0))
	if skew < -CallbackWindow || skew > CallbackWindow {
		return false
	}
	expected := SignPayload(secret, timestamp, body)
	return hmac.Equal([]byte(expected), []byte(signature))
}
