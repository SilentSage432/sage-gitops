package middleware

import (
	"net/http"
	"sync"
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
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			w.Write([]byte(`{"error":"INVALID_OR_EXPIRED_SESSION"}`))
			return
		}

		// Session authenticated — forward request
		next.ServeHTTP(w, r)
	})
}

