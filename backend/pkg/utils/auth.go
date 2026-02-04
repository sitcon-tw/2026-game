package utils

import "strings"

// BearerToken extracts the token part from an Authorization header.
// Returns empty string if the header is missing or not in Bearer format.
func BearerToken(header string) string {
	const prefix = "Bearer "
	if header == "" {
		return ""
	}
	if !strings.HasPrefix(header, prefix) {
		return ""
	}
	return strings.TrimSpace(strings.TrimPrefix(header, prefix))
}
