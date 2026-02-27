package helpers

import (
	"crypto/rand"
	"errors"
)

const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

// RandomAlphabetToken returns a cryptographically random alphabet-only token.
func RandomAlphabetToken(length int) (string, error) {
	if length <= 0 {
		return "", errors.New("length must be positive")
	}

	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}

	token := make([]byte, length)
	for i := range b {
		token[i] = alphabet[int(b[i])%len(alphabet)]
	}

	return string(token), nil
}
