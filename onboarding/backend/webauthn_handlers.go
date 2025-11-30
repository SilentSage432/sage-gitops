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

	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	
	"github.com/silentsage432/sage-gitops/onboarding/backend/handlers"
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
	user, err := handlers.GetOperatorKey(ctx, getDB(ctx), req.Operator)
	if err != nil {
		log.Printf("WebAuthn Begin: GetOperatorKey failed for operator %s: %v", req.Operator, err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "failed to get operator user",
		})
		return
	}
	
	if user == nil {
		log.Printf("WebAuthn Begin: GetOperatorKey returned nil for operator %s", req.Operator)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "failed to get operator user",
		})
		return
	}
	
	log.Printf("WebAuthn Begin: User retrieved: ID=%s, Name=%s", user.WebAuthnName(), user.WebAuthnDisplayName())

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

	// Extract user entity and challenge from original options
	userEntity := options.Response.User
	challenge := options.Response.Challenge

	// In BeginRegistration options - replace with correct structure
	options = &protocol.CredentialCreation{
		Response: protocol.PublicKeyCredentialCreationOptions{
			RelyingParty: protocol.RelyingPartyEntity{
				ID: "localhost",
			},
			User: userEntity,
			Challenge: challenge,
			AuthenticatorSelection: protocol.AuthenticatorSelection{
				UserVerification:       protocol.VerificationRequired,
				AuthenticatorAttachment: protocol.AuthenticatorAttachment("cross-platform"),
			},
			Attestation: protocol.PreferNoAttestation,
			Timeout:     300000,
			Parameters: []protocol.CredentialParameter{
				{Type: protocol.PublicKeyCredentialType, Algorithm: -7},
			},
		},
	}

	if err := SaveSession(ctx, req.Operator, session); err != nil {
		log.Printf("WebAuthn Begin: SaveSession failed for operator %s: %v", req.Operator, err)
		// Continue anyway - session save failure shouldn't block registration begin
		// But log it for debugging
	}

	// The go-webauthn library returns a protocol.CredentialCreation object
	// This already contains the "publicKey" field with all the options
	// We can return it directly - the frontend should access it correctly
	w.Header().Set("Content-Type", "application/json")
	
	// Log the options structure for debugging
	log.Printf("WebAuthn Begin: Options type: %T, has PublicKey field: %v", options, options != nil)
	
	if err := json.NewEncoder(w).Encode(options); err != nil {
		log.Printf("WebAuthn Begin: Failed to encode response: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to encode options",
		})
		return
	}
	
	log.Printf("WebAuthn Begin: Successfully generated challenge for operator %s", req.Operator)
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
	user, err := handlers.GetOperatorKey(ctx, getDB(ctx), req.Operator)
	if err != nil {
		log.Printf("WebAuthn Finish: GetOperatorKey failed for operator %s: %v", req.Operator, err)
		http.Error(w, "failed to get operator user", http.StatusInternalServerError)
		return
	}

	session, err := LoadSession(ctx, req.Operator)
	if err != nil {
		log.Printf("WebAuthn Finish: LoadSession failed for operator %s: %v", req.Operator, err)
		http.Error(w, "Failed to load session", http.StatusInternalServerError)
		return
	}
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

	// Save credential to operators table using new handler function
	if err := handlers.SaveOperatorKey(ctx, getDB(ctx), req.Operator, cred); err != nil {
		log.Printf("WebAuthn Finish: SaveOperatorKey failed for operator %s: %v", req.Operator, err)
		http.Error(w, "failed to save credential", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"registered"}`))
}

// DEPRECATED: GetOperator is no longer used
// Use handlers.GetOperatorKey() instead
// Kept for backward compatibility only

// SaveSession stores a WebAuthn session in memory/database
// Returns error if database operation fails
func SaveSession(ctx context.Context, id string, session interface{}) error {
	// Store in database (operator_keys table)
	sessionJSON, err := json.Marshal(session)
	if err != nil {
		log.Printf("SaveSession: Failed to marshal session: %v", err)
		return err
	}

	// Use gen_random_uuid() via DEFAULT instead of passing UUID string
	// This works with both UUID and TEXT id columns
	_, err = getDB(ctx).Exec(ctx,
		"INSERT INTO public.operator_keys (id, user_id, session_data, created_at) VALUES (gen_random_uuid(), $1, $2::jsonb, $3) ON CONFLICT (user_id) DO UPDATE SET session_data = $2::jsonb, updated_at = $3",
		id,
		sessionJSON,
		time.Now(),
	)
	if err != nil {
		log.Printf("SaveSession: Database error for user_id %s: %v", id, err)
		return err
	}

	return nil
}

// LoadSession retrieves a WebAuthn session
// Returns (session, error) - error is nil if session not found (expected case)
func LoadSession(ctx context.Context, id string) (interface{}, error) {
	// Retrieve from database (operator_keys table)
	// session_data is JSONB, so we need to cast it properly
	var sessionData []byte
	err := getDB(ctx).QueryRow(ctx,
		"SELECT session_data::text FROM public.operator_keys WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
		id,
	).Scan(&sessionData)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// No session found - this is expected for new registrations
			return nil, nil
		}
		log.Printf("LoadSession: Database error for user_id %s: %v", id, err)
		return nil, err
	}

	var session webauthn.SessionData
	if err := json.Unmarshal(sessionData, &session); err != nil {
		log.Printf("LoadSession: Failed to unmarshal session data for user_id %s: %v", id, err)
		return nil, err
	}

	return &session, nil
}

// DEPRECATED: SaveCredential is no longer used
// Credentials are now stored in the operators table via handlers.SaveOperatorKey()
// This function wrote to operator_keys.credential_data which is not used
// Kept for reference only - should be removed in future cleanup

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
	user, err := handlers.GetOperatorKey(ctx, getDB(ctx), req.Operator)
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

	if err := SaveSession(ctx, req.Operator, session); err != nil {
		log.Printf("WebAuthn Verify Begin: SaveSession failed for operator %s: %v", req.Operator, err)
		// Continue anyway - session save failure shouldn't block verification begin
	}

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
	session, err := LoadSession(ctx, req.Operator)
	if err != nil {
		log.Printf("WebAuthn Verify Finish: LoadSession failed for operator %s: %v", req.Operator, err)
		http.Error(w, "Failed to load session", http.StatusInternalServerError)
		return
	}
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
	user, err := handlers.GetOperatorKey(ctx, getDB(ctx), req.Operator)
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
		"identity": user.WebAuthnName(),
	})
}

// GetOperatorWithCredentials loads a user and their stored credentials from the database
// This is required for authentication (BeginLogin/FinishLogin)
// DEPRECATED: Use handlers.GetOperatorKey instead
func GetOperatorWithCredentials(ctx context.Context, operatorID string) (*WebAuthnUser, error) {
	// Use the new handlers function which uses the operators table
	handlersUser, err := handlers.GetOperatorKey(ctx, getDB(ctx), operatorID)
	if err != nil {
		return nil, err
	}
	
	// Convert handlers.WebAuthnUser to local WebAuthnUser type for backward compatibility
	// This is a temporary bridge until all code is migrated
	// Use interface methods to access fields (userID is unexported)
	return &WebAuthnUser{
		ID:          handlersUser.WebAuthnID(),
		Name:        handlersUser.WebAuthnName(),
		DisplayName: handlersUser.WebAuthnDisplayName(),
		userID:      operatorID, // Use operatorID directly since userID field is not accessible
		credentials: handlersUser.WebAuthnCredentials(),
	}, nil
}

// handleIssueToken issues a JWT access token for operator "prime"
// This is a temporary solution until Federation + Rho² takeover
func handleIssueToken(w http.ResponseWriter, r *http.Request) {
	// Local secret for HS256 signing (temporary)
	// In production, this should be loaded from environment variable
	secret := []byte("onboarding-temp-secret-change-in-production")
	
	// Create JWT claims for operator "prime"
	claims := jwt.MapClaims{
		"operator": "prime",
		"iat":      time.Now().Unix(),
		"exp":      time.Now().Add(24 * time.Hour).Unix(), // 24 hour expiration
	}
	
	// Create token with HS256
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	
	// Sign token
	tokenString, err := token.SignedString(secret)
	if err != nil {
		log.Printf("Token issuance failed: %v", err)
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}
	
	// Return token
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"token": tokenString,
	})
}

