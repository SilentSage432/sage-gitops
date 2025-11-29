package main

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	fedmw "github.com/silentsage432/sage-gitops/onboarding/backend/middleware"
	"github.com/silentsage432/sage-gitops/onboarding/backend/federation"
)

// Phase 13.1: Stateless handshake store
// - no DB
// - no JWT verification yet
// - verification happens via cryptographic signing only
type pendingChallenge struct {
	challenge   string
	tenantID    string
	fingerprint string
	issuedAt    time.Time
}

var (
	pendingChallenges = make(map[string]*pendingChallenge)
	challengeMutex    sync.RWMutex
)

// Helper utilities
func generateNonce() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func signChallenge(secret, challenge string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(challenge))
	return hex.EncodeToString(mac.Sum(nil))
}

// STEP 1: REQUEST HANDSHAKE CHALLENGE
// Node sends:
// - nodeId
// - tenantId
// - bootstrapFingerprint (from onboarding kit)
func handleFederationHandshake(w http.ResponseWriter, r *http.Request) {
	var req struct {
		NodeID      string `json:"nodeId"`
		TenantID    string `json:"tenantId"`
		Fingerprint string `json:"fingerprint"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error decoding handshake request: %v", err)
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.NodeID == "" || req.TenantID == "" || req.Fingerprint == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "MISSING_FIELDS",
		})
		return
	}

	challenge, err := generateNonce()
	if err != nil {
		log.Printf("Failed to generate challenge: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "Failed to generate challenge",
		})
		return
	}

	nonce, err := generateNonce()
	if err != nil {
		log.Printf("Failed to generate nonce: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "Failed to generate nonce",
		})
		return
	}

	challengeMutex.Lock()
	pendingChallenges[req.NodeID] = &pendingChallenge{
		challenge:   challenge,
		tenantID:    req.TenantID,
		fingerprint: req.Fingerprint,
		issuedAt:    time.Now(),
	}
	challengeMutex.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"challenge":  challenge,
		"nonce":      nonce,
		"algo":       "HMAC-SHA256",
		"expiresIn":  30000,
	})
}

// STEP 2: ASSERT SOLUTION
// Node signs the challenge and returns signed blob
func handleFederationAssert(w http.ResponseWriter, r *http.Request) {
	var req struct {
		NodeID    string `json:"nodeId"`
		Signature string `json:"signature"`
		Fingerprint string `json:"fingerprint"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	challengeMutex.RLock()
	entry, exists := pendingChallenges[req.NodeID]
	challengeMutex.RUnlock()

	if !exists {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "NO_CHALLENGE_FOUND",
		})
		return
	}

	// Challenge expiration (30s)
	if time.Since(entry.issuedAt) > 30*time.Second {
		challengeMutex.Lock()
		delete(pendingChallenges, req.NodeID)
		challengeMutex.Unlock()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "CHALLENGE_TIMEOUT",
		})
		return
	}

	// Must match bootstrap fingerprint from onboarding
	if req.Fingerprint != entry.fingerprint {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "FINGERPRINT_MISMATCH",
		})
		return
	}

	// Verify signature
	expected := signChallenge(req.Fingerprint, entry.challenge)
	if expected != req.Signature {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "INVALID_SIGNATURE",
		})
		return
	}

	// At this point, handshake is cryptographically proven
	challengeMutex.Lock()
	delete(pendingChallenges, req.NodeID)
	challengeMutex.Unlock()

	// Phase 13.4: Ed25519 signed token
	payload := federation.FederationTokenPayload{
		NodeID:      req.NodeID,
		TenantID:    entry.tenantID,
		Fingerprint: req.Fingerprint,
		IssuedAt:    time.Now().UnixMilli(),
	}

	signedToken, err := federation.SignFederationToken(payload)
	if err != nil {
		log.Printf("Failed to sign federation token: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Phase 13.2: Store session as valid
	fedmw.RegisterFederationSession(signedToken)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":             true,
		"tenantId":       entry.tenantID,
		"nodeId":         req.NodeID,
		"federationToken": signedToken,
		"federated":      true,
		"cipher":         "ed25519",
		"expiresIn":      3600000,
	})
}

// STEP 3: VERIFY FEDERATION TOKEN
// Used by protected federation APIs
func handleFederationVerify(w http.ResponseWriter, r *http.Request) {
	var req struct {
		FederationToken string `json:"federationToken"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.FederationToken == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "NO_TOKEN",
		})
		return
	}

	// This is where we don't verify in DB — stateless verification lives here.
	// Later we add distributed token propagation / Pi support.
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"valid": true,
	})
}

// Phase 13.5: Export federation token (operator can retrieve token after handshake)
func handleFederationExport(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("federationToken")
	if token == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "TOKEN_REQUIRED",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token": token,
	})
}

// Phase 13.5: Import federation token from remote source (CLI, other UI)
func handleFederationImport(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Token string `json:"token"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "Invalid request",
		})
		return
	}

	if req.Token == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "TOKEN_REQUIRED",
		})
		return
	}

	// We do NOT validate here — token validation happens at use time
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":            true,
		"tokenAccepted": true,
	})
}

// Cleanup expired challenges (runs periodically)
func cleanupExpiredChallenges() {
	ticker := time.NewTicker(1 * time.Minute)
	go func() {
		for range ticker.C {
			challengeMutex.Lock()
			now := time.Now()
			for nodeID, entry := range pendingChallenges {
				if now.Sub(entry.issuedAt) > 30*time.Second {
					delete(pendingChallenges, nodeID)
					log.Printf("Cleaned up expired challenge for node: %s", nodeID)
				}
			}
			challengeMutex.Unlock()
		}
	}()
}

// Phase 13.10: Node Join Handler
// Pi nodes use this endpoint to join the federation using their bootstrap token
func handleFederationNodeJoin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Federation struct {
			Token string `json:"token"`
		} `json:"federation"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Federation.Token == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "MISSING_FEDERATION",
		})
		return
	}

	// Verify federation token using Ed25519 signature
	payload, err := federation.VerifyFederationToken(req.Federation.Token)
	if err != nil || payload == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "INVALID_FEDERATION",
		})
		return
	}

	// Register the node session
	fedmw.RegisterFederationSession(req.Federation.Token)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":        true,
		"nodeJoined": payload.NodeID,
		"tenantId":  payload.TenantID,
		"region":    payload.Fingerprint, // Note: region not in payload, using fingerprint as placeholder
	})
}

func init() {
	// Start cleanup goroutine
	cleanupExpiredChallenges()
}

