package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
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
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	user := GetOperator(req.Operator)

	options, session, err := WAuth.BeginRegistration(user)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	SaveSession(ctx, req.Operator, session)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(options)
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

