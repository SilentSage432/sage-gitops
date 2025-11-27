package federation

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
)

// Phase 13.4: Ed25519 signed federation tokens
// In production this keypair will eventually come from Rho²
// For now: stored in memory; persistent later
var (
	keyPair     ed25519.PrivateKey
	keyPairOnce sync.Once
)

// Initialize keypair (lazy initialization)
func initKeyPair() {
	keyPairOnce.Do(func() {
		var err error
		_, keyPair, err = ed25519.GenerateKey(rand.Reader)
		if err != nil {
			panic(fmt.Sprintf("Failed to generate Ed25519 keypair: %v", err))
		}
	})
}

// FederationTokenPayload represents the payload in a signed token
type FederationTokenPayload struct {
	NodeID      string `json:"nodeId"`
	TenantID    string `json:"tenantId"`
	Fingerprint string `json:"fingerprint"`
	IssuedAt    int64  `json:"issuedAt"`
}

// SignFederationToken converts payload to signed token
// Format: base64(payload).base64(signature)
func SignFederationToken(payload FederationTokenPayload) (string, error) {
	initKeyPair()

	// Serialize payload to JSON
	data, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal payload: %w", err)
	}

	// Sign the payload
	signature := ed25519.Sign(keyPair, data)

	// Encode payload and signature to base64
	payloadB64 := base64.RawURLEncoding.EncodeToString(data)
	signatureB64 := base64.RawURLEncoding.EncodeToString(signature)

	// Return token in format: payload.signature
	return payloadB64 + "." + signatureB64, nil
}

// VerifyFederationToken verifies token signature and returns payload
// Returns error if signature is invalid
func VerifyFederationToken(token string) (*FederationTokenPayload, error) {
	initKeyPair()

	// Split token into payload and signature
	parts := splitToken(token)
	if len(parts) != 2 {
		return nil, errors.New("invalid token format")
	}

	payloadB64, signatureB64 := parts[0], parts[1]

	// Decode payload
	payloadData, err := base64.RawURLEncoding.DecodeString(payloadB64)
	if err != nil {
		return nil, fmt.Errorf("failed to decode payload: %w", err)
	}

	// Decode signature
	signature, err := base64.RawURLEncoding.DecodeString(signatureB64)
	if err != nil {
		return nil, fmt.Errorf("failed to decode signature: %w", err)
	}

	// Verify signature
	publicKey := keyPair.Public().(ed25519.PublicKey)
	if !ed25519.Verify(publicKey, payloadData, signature) {
		return nil, errors.New("invalid signature")
	}

	// Parse payload
	var payload FederationTokenPayload
	if err := json.Unmarshal(payloadData, &payload); err != nil {
		return nil, fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	return &payload, nil
}

// GetPublicKey returns the public key (for distribution to nodes)
func GetPublicKey() ed25519.PublicKey {
	initKeyPair()
	return keyPair.Public().(ed25519.PublicKey)
}

// Helper function to split token
func splitToken(token string) []string {
	parts := make([]string, 0, 2)
	lastIndex := 0
	for i, char := range token {
		if char == '.' {
			parts = append(parts, token[lastIndex:i])
			lastIndex = i + 1
		}
	}
	if lastIndex < len(token) {
		parts = append(parts, token[lastIndex:])
	}
	return parts
}

