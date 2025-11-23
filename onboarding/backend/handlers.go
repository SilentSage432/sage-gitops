package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// WebAuthn Challenge Handler
func handleWebAuthnChallenge(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Check if operator key already exists and has credentials
	var hasCredential bool
	err := dbPool.QueryRow(ctx, 
		"SELECT EXISTS(SELECT 1 FROM public.operator_keys WHERE user_id = $1 AND credential_data IS NOT NULL)",
		"tyson",
	).Scan(&hasCredential)
	
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "Database error",
		})
		return
	}

	user := &WebAuthnUser{
		ID:          []byte("tyson-only"),
		Name:        "tyson",
		DisplayName: "Tyson Zaugg",
		userID:      "tyson",
	}

	// Load credentials from database if they exist (for authentication)
	if hasCredential {
		var credentialBytes []byte
		err = dbPool.QueryRow(ctx,
			"SELECT credential_data FROM public.operator_keys WHERE user_id = $1 AND credential_data IS NOT NULL ORDER BY created_at DESC LIMIT 1",
			"tyson",
		).Scan(&credentialBytes)
		
		if err == nil {
			var cred webauthn.Credential
			if err := json.Unmarshal(credentialBytes, &cred); err == nil {
				user.credentials = []webauthn.Credential{cred}
			}
		}

		// Begin authentication flow
		options, session, err := webAuthn.BeginLogin(user)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error": fmt.Sprintf("Failed to begin login: %v", err),
			})
			return
		}

		// Store session in database
		sessionJSON, _ := json.Marshal(session)
		_, err = dbPool.Exec(ctx,
			"UPDATE public.operator_keys SET session_data = $1, updated_at = $2 WHERE user_id = $3",
			sessionJSON,
			time.Now(),
			"tyson",
		)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error": "Failed to store session",
			})
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(options)
	} else {
		// Begin registration flow
		options, session, err := webAuthn.BeginRegistration(user)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error": fmt.Sprintf("Failed to begin registration: %v", err),
			})
			return
		}

		// Store session in database
		sessionJSON, _ := json.Marshal(session)
		_, err = dbPool.Exec(ctx,
			"INSERT INTO public.operator_keys (id, user_id, session_data, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET session_data = $3, updated_at = $4",
			uuid.New().String(),
			"tyson",
			sessionJSON,
			time.Now(),
		)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error": "Failed to store session",
			})
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(options)
	}
}

// WebAuthn Verify Handler
func handleWebAuthnVerify(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Load session from database
	var sessionData []byte
	err := dbPool.QueryRow(ctx,
		"SELECT session_data FROM public.operator_keys WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
		"tyson",
	).Scan(&sessionData)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "No active session found", http.StatusUnauthorized)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	var session webauthn.SessionData
	if err := json.Unmarshal(sessionData, &session); err != nil {
		http.Error(w, "Invalid session data", http.StatusInternalServerError)
		return
	}

	// Check if user has credentials (for authentication) or not (for registration)
	var hasCredential bool
	err = dbPool.QueryRow(ctx,
		"SELECT EXISTS(SELECT 1 FROM public.operator_keys WHERE user_id = $1 AND credential_data IS NOT NULL)",
		"tyson",
	).Scan(&hasCredential)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "Database error",
		})
		return
	}

	user := &WebAuthnUser{
		ID:          []byte("tyson-only"),
		Name:        "tyson",
		DisplayName: "Tyson Zaugg",
		userID:      "tyson",
	}

	// Load credentials from database if they exist
	if hasCredential {
		var credentialBytes []byte
		err = dbPool.QueryRow(ctx,
			"SELECT credential_data FROM public.operator_keys WHERE user_id = $1 AND credential_data IS NOT NULL ORDER BY created_at DESC LIMIT 1",
			"tyson",
		).Scan(&credentialBytes)
		
		if err == nil {
			var cred webauthn.Credential
			if err := json.Unmarshal(credentialBytes, &cred); err == nil {
				user.credentials = []webauthn.Credential{cred}
			}
		}
	}

	if hasCredential {
		// Authentication flow
		_, err := webAuthn.FinishLogin(user, session, r)
		if err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"error":   fmt.Sprintf("Authentication failed: %v", err),
			})
			return
		}

		// Log audit event
		_, _ = dbPool.Exec(ctx,
			"INSERT INTO public.audit_log (event_type, user_id, details, created_at) VALUES ($1, $2, $3, $4)",
			"webauthn_success",
			"tyson",
			`{"action": "authentication", "device": "yubikey"}`,
			time.Now(),
		)
	} else {
		// Registration flow
		credentialData, err := webAuthn.FinishRegistration(user, session, r)
		if err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"error":   fmt.Sprintf("Registration failed: %v", err),
			})
			return
		}

		// Store credential for future authentication
		credentialJSON, _ := json.Marshal(credentialData)
		_, err = dbPool.Exec(ctx,
			"UPDATE public.operator_keys SET credential_data = $1, updated_at = $2 WHERE user_id = $3",
			credentialJSON,
			time.Now(),
			"tyson",
		)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"error":   "Failed to store credential",
			})
			return
		}

		// Log audit event
		_, _ = dbPool.Exec(ctx,
			"INSERT INTO public.audit_log (event_type, user_id, details, created_at) VALUES ($1, $2, $3, $4)",
			"webauthn_registered",
			"tyson",
			`{"action": "registration", "device": "yubikey"}`,
			time.Now(),
		)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"deviceName": "YubiKey",
	})
}

// Issue OCT Handler
func handleIssueOCT(w http.ResponseWriter, r *http.Request) {
	// Force bypass for development - return immediately before any DB checks
	if os.Getenv("BYPASS_OCT") == "true" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"token":     "mock-oct-token",
			"expiresAt": time.Now().Add(10 * time.Minute).Unix() * 1000, // JavaScript timestamp
			"scopes":    []string{"tenant.create", "agent.plan.create", "bootstrap.sign"},
		})
		return
	}

	ctx := r.Context()

	// DEV BYPASS: Generate mock OCT token when BYPASS_YUBIKEY=true
	if os.Getenv("BYPASS_YUBIKEY") == "true" {
		now := time.Now()
		expiresAt := now.Add(10 * time.Minute)

		claims := jwt.MapClaims{
			"sub":    "dev-operator",
			"iat":    now.Unix(),
			"exp":    expiresAt.Unix(),
			"scopes": []string{"tenant.create", "agent.plan.create", "bootstrap.sign"},
			"type":   "oct",
			"jti":    uuid.New().String(),
		}

		token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
		tokenString, err := token.SignedString(privateKey)
		if err != nil {
			http.Error(w, "Failed to sign token", http.StatusInternalServerError)
			return
		}

		// Store token in database for consistency
		_, _ = dbPool.Exec(ctx,
			"INSERT INTO public.capability_tokens (token_id, user_id, scopes, expires_at, created_at) VALUES ($1, $2, $3, $4, $5)",
			claims["jti"],
			"dev-operator",
			[]string{"tenant.create", "agent.plan.create", "bootstrap.sign"},
			expiresAt,
			now,
		)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"token":     tokenString,
			"expiresAt": expiresAt.Unix() * 1000, // JavaScript timestamp
			"scopes":    []string{"tenant.create", "agent.plan.create", "bootstrap.sign"},
		})
		return
	}

	// Normal flow: Verify that user is authenticated (has credential in database)
	var hasCredential bool
	err := dbPool.QueryRow(ctx,
		"SELECT EXISTS(SELECT 1 FROM public.operator_keys WHERE user_id = $1 AND credential_data IS NOT NULL)",
		"tyson",
	).Scan(&hasCredential)

	if err != nil || !hasCredential {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Create OCT token
	now := time.Now()
	expiresAt := now.Add(10 * time.Minute)

	claims := jwt.MapClaims{
		"sub":      "tyson",
		"iat":      now.Unix(),
		"exp":      expiresAt.Unix(),
		"scopes":   []string{"tenant.create", "agent.plan.create", "bootstrap.sign"},
		"type":     "oct",
		"jti":      uuid.New().String(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	tokenString, err := token.SignedString(privateKey)
	if err != nil {
		http.Error(w, "Failed to sign token", http.StatusInternalServerError)
		return
	}

	// Store token in database
	_, err = dbPool.Exec(ctx,
		"INSERT INTO public.capability_tokens (token_id, user_id, scopes, expires_at, created_at) VALUES ($1, $2, $3, $4, $5)",
		claims["jti"],
		"tyson",
		[]string{"tenant.create", "agent.plan.create", "bootstrap.sign"},
		expiresAt,
		now,
	)
	if err != nil {
		http.Error(w, "Failed to store token", http.StatusInternalServerError)
		return
	}

	// Log audit event
	_, _ = dbPool.Exec(ctx,
		"INSERT INTO public.audit_log (event_type, user_id, details, created_at) VALUES ($1, $2, $3, $4)",
		"oct_issued",
		"tyson",
		fmt.Sprintf(`{"token_id": "%s", "scopes": ["tenant.create", "agent.plan.create", "bootstrap.sign"]}`, claims["jti"]),
		now,
	)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token":     tokenString,
		"expiresAt": expiresAt.Unix() * 1000, // JavaScript timestamp
		"scopes":    []string{"tenant.create", "agent.plan.create", "bootstrap.sign"},
	})
}

// Verify OCT Handler
func handleVerifyOCT(w http.ResponseWriter, r *http.Request) {
	// Force bypass for development
	if os.Getenv("BYPASS_OCT") == "true" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"valid": true,
		})
		return
	}

	ctx := r.Context()

	var req struct {
		Token string `json:"token"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Verify JWT signature
	token, err := jwt.Parse(req.Token, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return &privateKey.PublicKey, nil
	})

	if err != nil || !token.Valid {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"valid": false,
		})
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"valid": false,
		})
		return
	}

	// Verify token exists in database and is not expired
	var expiresAt time.Time
	var scopes []string
	err = dbPool.QueryRow(ctx,
		"SELECT expires_at, scopes FROM public.capability_tokens WHERE token_id = $1",
		claims["jti"],
	).Scan(&expiresAt, &scopes)

	if err != nil || time.Now().After(expiresAt) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"valid": false,
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"valid":     true,
		"scopes":    claims["scopes"],
		"expiresAt": expiresAt.Unix() * 1000,
	})
}

// Create Tenant Handler
func handleCreateTenant(w http.ResponseWriter, r *http.Request) {
	// Force bypass for development
	if os.Getenv("BYPASS_OCT") == "true" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":  true,
			"tenantID": "mock-tenant-id",
		})
		return
	}

	ctx := r.Context()

	// Verify OCT token
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" || len(authHeader) < 7 || authHeader[:7] != "Bearer " {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tokenString := authHeader[7:]
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return &privateKey.PublicKey, nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		http.Error(w, "Invalid token claims", http.StatusUnauthorized)
		return
	}

	scopes, _ := claims["scopes"].([]interface{})
	hasScope := false
	for _, scope := range scopes {
		if scope == "tenant.create" {
			hasScope = true
			break
		}
	}

	if !hasScope {
		http.Error(w, "Insufficient permissions", http.StatusForbidden)
		return
	}

	var req struct {
		Company     interface{} `json:"company"`
		DataRegions interface{} `json:"dataRegions"`
		AgentPlan   interface{} `json:"agentPlan"`
		AccessModel interface{} `json:"accessModel"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Create tenant
	tenantID := uuid.New().String()
	tenantData, _ := json.Marshal(req)

	_, err = dbPool.Exec(ctx,
		"INSERT INTO public.tenants (id, name, config_data, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)",
		tenantID,
		"tenant-"+tenantID[:8],
		tenantData,
		time.Now(),
		time.Now(),
	)

	if err != nil {
		http.Error(w, "Failed to create tenant", http.StatusInternalServerError)
		return
	}

	// Log audit event
	_, _ = dbPool.Exec(ctx,
		"INSERT INTO public.audit_log (event_type, user_id, details, created_at) VALUES ($1, $2, $3, $4)",
		"tenant_created",
		claims["sub"].(string),
		fmt.Sprintf(`{"tenant_id": "%s"}`, tenantID),
		time.Now(),
	)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"tenantID": tenantID,
	})
}

// Bootstrap Kit Handler
func handleBootstrapKit(w http.ResponseWriter, r *http.Request) {
	// Force bypass for development
	if os.Getenv("BYPASS_OCT") == "true" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"fingerprint": "sha256:mock-fingerprint-" + uuid.New().String()[:16],
		})
		return
	}

	// Verify OCT token
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" || len(authHeader) < 7 || authHeader[:7] != "Bearer " {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tokenString := authHeader[7:]
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return &privateKey.PublicKey, nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		http.Error(w, "Invalid token claims", http.StatusUnauthorized)
		return
	}

	scopes, _ := claims["scopes"].([]interface{})
	hasScope := false
	for _, scope := range scopes {
		if scope == "bootstrap.sign" {
			hasScope = true
			break
		}
	}

	if !hasScope {
		http.Error(w, "Insufficient permissions", http.StatusForbidden)
		return
	}

	// Generate bootstrap kit (placeholder ZIP)
	bootstrapContent := []byte("bootstrap-kit-placeholder")
	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", "attachment; filename=bootstrap.zip")
	w.Write(bootstrapContent)
}

// Bootstrap Meta Handler
func handleBootstrapMeta(w http.ResponseWriter, r *http.Request) {

	// Verify OCT token
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" || len(authHeader) < 7 || authHeader[:7] != "Bearer " {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tokenString := authHeader[7:]
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return &privateKey.PublicKey, nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	// Return bootstrap metadata
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"fingerprint":   "sha256:abc123def456...",
		"verifyCommand": "shasum -a 256 bootstrap.zip | grep abc123def456",
	})
}

// WebAuthnUser implements webauthn.User
type WebAuthnUser struct {
	ID          []byte
	Name        string
	DisplayName string
	userID      string
	credentials []webauthn.Credential
}

func (u *WebAuthnUser) WebAuthnID() []byte {
	return u.ID
}

func (u *WebAuthnUser) WebAuthnName() string {
	return u.Name
}

func (u *WebAuthnUser) WebAuthnDisplayName() string {
	return u.DisplayName
}

func (u *WebAuthnUser) WebAuthnCredentials() []webauthn.Credential {
	if u.credentials == nil {
		return []webauthn.Credential{}
	}
	return u.credentials
}

func (u *WebAuthnUser) WebAuthnIcon() string {
	return ""
}

