package helpers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"
)

const (
	qrTokenStepSeconds = int64(20)
	qrTokenDigits      = 6
	qrTokenWindow      = int64(1)
	offsetMask         = 0x0F
	mostSignificantBit = 0x7F
	bitShift24         = 24
	bitShift16         = 16
	bitShift8          = 8
)

// QRTokenTTL returns the configured validity period for each QR token.
func QRTokenTTL() time.Duration {
	return time.Duration(qrTokenStepSeconds) * time.Second
}

// QRTokenExpiry returns the expiration time of the current token step.
func QRTokenExpiry(now time.Time) time.Time {
	step := now.UTC().Unix() / qrTokenStepSeconds
	return time.Unix((step+1)*qrTokenStepSeconds, 0).UTC()
}

// BuildUserOneTimeQRToken creates a short-lived user QR token in the form:
// qru1.<base64url(userID)>.<6-digit-code>
func BuildUserOneTimeQRToken(userID string, secret string, now time.Time) string {
	step := now.UTC().Unix() / qrTokenStepSeconds
	userPart := base64.RawURLEncoding.EncodeToString([]byte(userID))
	code := qrStepCode(secret, step)
	return fmt.Sprintf("qru1.%s.%06d", userPart, code)
}

// VerifyAndExtractUserIDFromOneTimeQRToken validates token freshness and signature.
// It returns the embedded user ID when the token is valid.
func VerifyAndExtractUserIDFromOneTimeQRToken(token string, now time.Time, lookupSecret func(string) (string, error)) (string, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 || parts[0] != "qru1" {
		return "", errors.New("invalid token format")
	}

	userIDBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return "", errors.New("invalid user id encoding")
	}
	userID := string(userIDBytes)
	if userID == "" {
		return "", errors.New("missing user id")
	}

	providedCode, err := strconv.Atoi(parts[2])
	if err != nil {
		return "", errors.New("invalid token code")
	}

	secret, err := lookupSecret(userID)
	if err != nil {
		return "", err
	}

	stepNow := now.UTC().Unix() / qrTokenStepSeconds
	for offset := -qrTokenWindow; offset <= qrTokenWindow; offset++ {
		expectedCode := qrStepCode(secret, stepNow+offset)
		if expectedCode == providedCode {
			return userID, nil
		}
	}

	return "", errors.New("token expired or invalid")
}

func qrStepCode(secret string, step int64) int {
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(strconv.FormatInt(step, 10)))
	sum := mac.Sum(nil)

	offset := sum[len(sum)-1] & offsetMask
	binary := int(sum[offset]&mostSignificantBit)<<bitShift24 |
		int(sum[offset+1])<<bitShift16 |
		int(sum[offset+2])<<bitShift8 |
		int(sum[offset+3])

	mod := 1
	for range qrTokenDigits {
		mod *= 10
	}
	return binary % mod
}
