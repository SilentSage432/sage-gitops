package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type RegistrationBeginRequest struct {
	Operator string `json:"operator"`
}

func handleWebAuthnBegin(w http.ResponseWriter, r *http.Request) {
	var req RegistrationBeginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("WebAuthn Begin: Failed to decode request: %v", err)
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if WAuth == nil {
		log.Printf("WebAuthn Begin: WAuth is nil - WebAuthn not initialized")
		http.Error(w, "WebAuthn not initialized", http.StatusInternalServerError)
		return
	}

	ctx := r.Context()
	user := GetOperator(req.Operator)

	options, session, err := WAuth.BeginRegistration(user)
	if err != nil {
		log.Printf("WebAuthn Begin: BeginRegistration failed for operator %s: %v", req.Operator, err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": err.Error(),
		})
		return
	}

	SaveSession(ctx, req.Operator, session)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(options); err != nil {
		log.Printf("WebAuthn Begin: Failed to encode response: %v", err)
	}
}

type RegistrationFinishRequest struct {
	Operator   string          `json:"operator"`
	Credential json.RawMessage `json:"credential"`
}

func handleWebAuthnFinish(w http.ResponseWriter, r *http.Request) {
	var req RegistrationFinishRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	user := GetOperator(req.Operator)

	session := LoadSession(ctx, req.Operator)
	if session == nil {
		http.Error(w, "No active session found", http.StatusUnauthorized)
		return
	}

	// Convert session to webauthn.SessionData
	sessionData, ok := session.(*webauthn.SessionData)
	if !ok {
		http.Error(w, "Invalid session type", http.StatusInternalServerError)
		return
	}

	// The go-webauthn library's FinishRegistration expects the credential in the request body
	// We need to create a new request body with just the credential JSON
	credentialBytes, err := json.Marshal(req.Credential)
	if err != nil {
		http.Error(w, "Failed to marshal credential", http.StatusBadRequest)
		return
	}

	// Create a new request with just the credential in the body for FinishRegistration
	// We'll create a minimal http.Request wrapper that contains the credential
	credentialReader := bytes.NewReader(credentialBytes)
	newReq := r.Clone(ctx)
	newReq.Body = io.NopCloser(credentialReader)
	newReq.ContentLength = int64(len(credentialBytes))

	// FinishRegistration expects *http.Request to parse credential from request body
	cred, err := WAuth.FinishRegistration(user, *sessionData, newReq)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	SaveCredential(ctx, req.Operator, cred)

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"registered"}`))
}

// GetOperator retrieves or creates a WebAuthnUser for the given operator ID
func GetOperator(operatorID string) *WebAuthnUser {
	// For now, return a simple user structure
	// In production, this would load from database
	user := &WebAuthnUser{
		ID:          []byte(operatorID),
		Name:        operatorID,
		DisplayName: operatorID,
		userID:      operatorID,
		credentials: []webauthn.Credential{},
	}

	// TODO: Load existing credentials from database if available
	// For now, we start with empty credentials

	return user
}

// SaveSession stores a WebAuthn session in memory/database
func SaveSession(ctx context.Context, id string, session interface{}) {
	// TODO: store in memory/redis/disk
	// For now, store in database (operator_keys table)
	sessionJSON, err := json.Marshal(session)
	if err != nil {
		return
	}

	_, _ = getDB(ctx).Exec(ctx,
		"INSERT INTO public.operator_keys (id, user_id, session_data, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET session_data = $3, updated_at = $4",
		uuid.New().String(),
		id,
		sessionJSON,
		time.Now(),
	)
}

// LoadSession retrieves a WebAuthn session
func LoadSession(ctx context.Context, id string) interface{} {
	// TODO: retrieve session
	// For now, retrieve from database
	var sessionData []byte
	err := getDB(ctx).QueryRow(ctx,
		"SELECT session_data FROM public.operator_keys WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
		id,
	).Scan(&sessionData)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		return nil
	}

	var session webauthn.SessionData
	if err := json.Unmarshal(sessionData, &session); err != nil {
		return nil
	}

	return &session
}

// SaveCredential stores a WebAuthn credential
func SaveCredential(ctx context.Context, id string, cred interface{}) {
	// TODO: store credential
	// For now, store in database
	credentialJSON, err := json.Marshal(cred)
	if err != nil {
		return
	}

	_, _ = getDB(ctx).Exec(ctx,
		"UPDATE public.operator_keys SET credential_data = $1, updated_at = $2 WHERE user_id = $3",
		credentialJSON,
		time.Now(),
		id,
	)
}

// Phase 3: WebAuthn Verification Handlers
// Verification proves your identity belongs to the system
// Still passive - no enforcement yet

type VerifyBeginRequest struct {
	Operator string `json:"operator"`
}

func handleWebAuthnVerifyBegin(w http.ResponseWriter, r *http.Request) {
	var req VerifyBeginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	user, err := GetOperatorWithCredentials(ctx, req.Operator)
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}

	// BeginLogin requires the user to have existing credentials
	if len(user.WebAuthnCredentials()) == 0 {
		http.Error(w, "no credentials found for user", http.StatusNotFound)
		return
	}

	options, session, err := WAuth.BeginLogin(user)
	if err != nil {
		http.Error(w, "error generating challenge", http.StatusInternalServerError)
		return
	}

	SaveSession(ctx, req.Operator, session)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(options)
}

type VerifyFinishRequest struct {
	Operator   string          `json:"operator"`
	Credential json.RawMessage `json:"credential"`
}

func handleWebAuthnVerifyFinish(w http.ResponseWriter, r *http.Request) {
	var req VerifyFinishRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	session := LoadSession(ctx, req.Operator)
	if session == nil {
		http.Error(w, "no session", http.StatusUnauthorized)
		return
	}

	// Convert session to webauthn.SessionData
	sessionData, ok := session.(*webauthn.SessionData)
	if !ok {
		http.Error(w, "Invalid session type", http.StatusInternalServerError)
		return
	}

	// Load user with credentials for verification
	user, err := GetOperatorWithCredentials(ctx, req.Operator)
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}

	// Create a new request with just the credential in the body for FinishLogin
	credentialBytes, err := json.Marshal(req.Credential)
	if err != nil {
		http.Error(w, "Failed to marshal credential", http.StatusBadRequest)
		return
	}

	credentialReader := bytes.NewReader(credentialBytes)
	newReq := r.Clone(ctx)
	newReq.Body = io.NopCloser(credentialReader)
	newReq.ContentLength = int64(len(credentialBytes))

	// FinishLogin verifies the credential and returns the user
	_, err = WAuth.FinishLogin(user, *sessionData, newReq)
	if err != nil {
		http.Error(w, "verification failed", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":   "verified",
		"identity": user.Name,
	})
}

// GetOperatorWithCredentials loads a user and their stored credentials from the database
// This is required for authentication (BeginLogin/FinishLogin)
func GetOperatorWithCredentials(ctx context.Context, operatorID string) (*WebAuthnUser, error) {
	user := &WebAuthnUser{
		ID:          []byte(operatorID),
		Name:        operatorID,
		DisplayName: operatorID,
		userID:      operatorID,
		credentials: []webauthn.Credential{},
	}

	// Load credentials from database
	var credentialData []byte
	err := getDB(ctx).QueryRow(ctx,
		"SELECT credential_data FROM public.operator_keys WHERE user_id = $1 AND credential_data IS NOT NULL ORDER BY created_at DESC LIMIT 1",
		operatorID,
	).Scan(&credentialData)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return user, nil // User exists but no credentials yet
		}
		return nil, err
	}

	// The go-webauthn library's FinishRegistration returns a webauthn.Credential
	// We need to properly deserialize it for BeginLogin
	// The credential contains ID, PublicKey, AttestationType, Authenticator metadata
	var storedCredential webauthn.Credential
	
	// Try to unmarshal the credential directly
	if err := json.Unmarshal(credentialData, &storedCredential); err != nil {
		// Phase 3: If direct unmarshal fails, the credential might be stored in a different format
		// For now, return user without credentials (verification will fail, which is expected)
		// This will be refined in later phases as we understand the exact storage format
		return user, nil
	}

	// Add the credential to the user's credential list for BeginLogin
	// BeginLogin uses these credentials to identify which authenticator to challenge
	if storedCredential.ID != nil {
		user.credentials = []webauthn.Credential{storedCredential}
	}

	return user, nil
}

