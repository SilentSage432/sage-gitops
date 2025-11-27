package middleware

import (
	"net/http"
	"sync"

	"github.com/silentsage432/sage-gitops/onboarding/backend/federation"
)

// Phase 13.2: Stateless token cache for validated sessions
// Later this will evolve into distributed propagation
var (
	activeFederationSessions = make(map[string]bool)
	sessionMutex             sync.RWMutex
)

// RegisterFederationSession registers a federation session token
func RegisterFederationSession(token string) {
	sessionMutex.Lock()
	activeFederationSessions[token] = true
	sessionMutex.Unlock()
}

// IsFederationSessionValid checks if a federation session token is valid
func IsFederationSessionValid(token string) bool {
	sessionMutex.RLock()
	defer sessionMutex.RUnlock()
	return activeFederationSessions[token]
}

// RevokeFederationSession revokes a federation session token
func RevokeFederationSession(token string) {
	sessionMutex.Lock()
	delete(activeFederationSessions, token)
	sessionMutex.Unlock()
}

// RequireFederationSession is middleware that requires a valid federation session token
func RequireFederationSession(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("X-Federation-Token")

		if token == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error":"NO_FEDERATION_TOKEN","required":true}`))
			return
		}

		if !IsFederationSessionValid(token) {
			// Phase 13.4: Signature check fallback
			payload, err := federation.VerifyFederationToken(token)
			if err != nil || payload == nil {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusForbidden)
				w.Write([]byte(`{"error":"INVALID_OR_EXPIRED_SESSION"}`))
				return
			}
			// Token is valid via signature verification
			// Optionally register it for faster future lookups
			RegisterFederationSession(token)
		}

		// Session authenticated — forward request
		next.ServeHTTP(w, r)
	})
}

