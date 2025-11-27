package middleware

import (
	"context"
	"net/http"

	"github.com/silentsage432/sage-gitops/onboarding/backend/federation"
)

// FederationContextKey is the key for storing federation payload in context
type FederationContextKey struct{}

// RequireAgentFederation is middleware that requires a valid federation token for agents
// Phase 13.11: Agents authenticate using the same Ed25519 federation token system
func RequireAgentFederation(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("X-Federation-Token")

		if token == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error":"MISSING_FEDERATION_TOKEN"}`))
			return
		}

		// Verify Ed25519 signature
		payload, err := federation.VerifyFederationToken(token)
		if err != nil || payload == nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			w.Write([]byte(`{"error":"INVALID_FEDERATION_TOKEN"}`))
			return
		}

		// Register session for faster future lookups
		RegisterFederationSession(token)

		// Attach federation payload to request context
		ctx := context.WithValue(r.Context(), FederationContextKey{}, payload)
		r = r.WithContext(ctx)

		// Agent authenticated — forward request
		next.ServeHTTP(w, r)
	})
}

// GetFederationPayload retrieves the federation payload from request context
func GetFederationPayload(r *http.Request) *federation.FederationTokenPayload {
	if payload, ok := r.Context().Value(FederationContextKey{}).(*federation.FederationTokenPayload); ok {
		return payload
	}
	return nil
}

