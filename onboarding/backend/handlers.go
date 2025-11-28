package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/silentsage432/sage-gitops/onboarding/backend/bootstrap"
	"github.com/silentsage432/sage-gitops/onboarding/backend/federation"
	fedmw "github.com/silentsage432/sage-gitops/onboarding/backend/middleware"
)

// WebAuthn Challenge Handler
func handleWebAuthnChallenge(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Check if operator key already exists and has credentials
	var hasCredential bool
	err := getDB(ctx).QueryRow(ctx,
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
		err = getDB(ctx).QueryRow(ctx,
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
		_, err = getDB(ctx).Exec(ctx,
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
		_, err = getDB(ctx).Exec(ctx,
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
	err := getDB(ctx).QueryRow(ctx,
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
		err = getDB(ctx).QueryRow(ctx,
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
		err = getDB(ctx).QueryRow(ctx,
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
		_, _ = getDB(ctx).Exec(ctx,
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
		_, err = getDB(ctx).Exec(ctx,
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
		_, _ = getDB(ctx).Exec(ctx,
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
			"expiresAt": time.Now().Add(10*time.Minute).Unix() * 1000, // JavaScript timestamp
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
		_, _ = getDB(ctx).Exec(ctx,
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
	err := getDB(ctx).QueryRow(ctx,
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
		"sub":    "tyson",
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

	// Store token in database
	_, err = getDB(ctx).Exec(ctx,
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
	_, _ = getDB(ctx).Exec(ctx,
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
	err = getDB(ctx).QueryRow(ctx,
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

// Request structs matching frontend schema
type CompanyData struct {
	Name     string  `json:"name"`
	Email    string  `json:"email"`
	Industry *string `json:"industry,omitempty"`
	Size     *string `json:"size,omitempty"`
	// Legacy fields for backward compatibility
	Domain *string `json:"domain,omitempty"`
	Region *string `json:"region,omitempty"`
}

type DataRegionsConfig struct {
	Sensitivity       *string  `json:"sensitivity,omitempty"`
	SelectedRegions   []string `json:"selectedRegions"`
	ResidencyRequired bool     `json:"residencyRequired"`
}

type AgentSelection struct {
	SelectedAgents []string `json:"selectedAgents"`
}

type AccessConfig struct {
	AuthMethod       string  `json:"authMethod"` // "local" | "sso"
	ScimEnabled      bool    `json:"scimEnabled,omitempty"`
	IdentityProvider *string `json:"identityProvider,omitempty"`
	ClientId         *string `json:"clientId,omitempty"`
	ClientSecret     *string `json:"clientSecret,omitempty"`
	CallbackUrl      *string `json:"callbackUrl,omitempty"`
	AdminEmail       *string `json:"adminEmail,omitempty"`
	TempPassword     *string `json:"tempPassword,omitempty"`
}

type CreateTenantRequest struct {
	Company           CompanyData       `json:"company"`
	DataRegionsConfig DataRegionsConfig `json:"dataRegionsConfig"`
	AgentSelection    AgentSelection    `json:"agentSelection"`
	AccessConfig      AccessConfig      `json:"accessConfig"`
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

	// Parse request with correct struct
	var req CreateTenantRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Company.Name == "" {
		http.Error(w, "Company name is required", http.StatusBadRequest)
		return
	}
	if req.Company.Email == "" {
		http.Error(w, "Company email is required", http.StatusBadRequest)
		return
	}
	if len(req.DataRegionsConfig.SelectedRegions) == 0 {
		http.Error(w, "At least one data region must be selected", http.StatusBadRequest)
		return
	}
	if len(req.AgentSelection.SelectedAgents) == 0 {
		http.Error(w, "At least one agent must be selected", http.StatusBadRequest)
		return
	}
	if req.AccessConfig.AuthMethod == "" {
		http.Error(w, "Authentication method is required", http.StatusBadRequest)
		return
	}

	// Validate auth method specific fields
	if req.AccessConfig.AuthMethod == "local" {
		if req.AccessConfig.AdminEmail == nil || *req.AccessConfig.AdminEmail == "" {
			http.Error(w, "Admin email is required for local authentication", http.StatusBadRequest)
			return
		}
	} else if req.AccessConfig.AuthMethod == "sso" {
		if req.AccessConfig.ClientId == nil || *req.AccessConfig.ClientId == "" {
			http.Error(w, "Client ID is required for SSO", http.StatusBadRequest)
			return
		}
		if req.AccessConfig.ClientSecret == nil || *req.AccessConfig.ClientSecret == "" {
			http.Error(w, "Client Secret is required for SSO", http.StatusBadRequest)
			return
		}
	} else {
		http.Error(w, "Invalid authentication method", http.StatusBadRequest)
		return
	}

	// Begin transaction
	tx, err := getDB(ctx).Begin(ctx)
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(ctx)

	// Create tenant
	tenantID := uuid.New().String()
	now := time.Now()

	// Extract domain from email if not provided
	domain := req.Company.Domain
	if domain == nil || *domain == "" {
		// Extract domain from email (simple extraction)
		emailParts := strings.Split(req.Company.Email, "@")
		if len(emailParts) == 2 {
			domainStr := emailParts[1]
			domain = &domainStr
		}
	}

	// Use first selected region as primary region (for backward compatibility)
	primaryRegion := ""
	if len(req.DataRegionsConfig.SelectedRegions) > 0 {
		primaryRegion = req.DataRegionsConfig.SelectedRegions[0]
	}

	// Store full config in JSONB
	configData, err := json.Marshal(req)
	if err != nil {
		http.Error(w, "Failed to marshal config data", http.StatusInternalServerError)
		return
	}

	// Insert tenant with proper name
	_, err = tx.Exec(ctx,
		"INSERT INTO public.tenants (id, name, domain, region, config_data, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
		tenantID,
		req.Company.Name, // Use actual company name
		domain,
		primaryRegion,
		configData,
		"pending",
		now,
		now,
	)

	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to create tenant: %v", err), http.StatusInternalServerError)
		return
	}

	// Create tenant_agents junction records
	if len(req.AgentSelection.SelectedAgents) > 0 {
		// Verify agents exist in registry (optional check)
		for _, agentID := range req.AgentSelection.SelectedAgents {
			var agentExists bool
			err := tx.QueryRow(ctx,
				"SELECT EXISTS(SELECT 1 FROM public.agents WHERE id = $1)",
				agentID,
			).Scan(&agentExists)

			// If agents table doesn't exist or agent not found, still create the link
			// (allows for backward compatibility during migration)
			if err == nil && !agentExists {
				// Log warning but continue (agent might be added later)
				log.Printf("Warning: Agent %s not found in registry, creating link anyway", agentID)
			}

			// Insert tenant_agent link
			_, err = tx.Exec(ctx,
				"INSERT INTO public.tenant_agents (tenant_id, agent_id, created_at) VALUES ($1, $2, $3) ON CONFLICT (tenant_id, agent_id) DO NOTHING",
				tenantID,
				agentID,
				now,
			)
			if err != nil {
				// If tenant_agents table doesn't exist yet, log and continue
				// (migration might not have run)
				log.Printf("Warning: Failed to create tenant_agent link: %v (table may not exist)", err)
			}
		}
	}

	// Store access config in tenant_policies for queryability
	accessPolicyData, err := json.Marshal(req.AccessConfig)
	if err == nil {
		// Check if policy already exists, update if it does, insert if not
		var policyExists bool
		_ = tx.QueryRow(ctx,
			"SELECT EXISTS(SELECT 1 FROM public.tenant_policies WHERE tenant_id = $1 AND policy_type = $2)",
			tenantID,
			"access_config",
		).Scan(&policyExists)

		if policyExists {
			_, _ = tx.Exec(ctx,
				"UPDATE public.tenant_policies SET policy_data = $1, updated_at = $2 WHERE tenant_id = $3 AND policy_type = $4",
				accessPolicyData,
				now,
				tenantID,
				"access_config",
			)
		} else {
			_, _ = tx.Exec(ctx,
				"INSERT INTO public.tenant_policies (tenant_id, policy_type, policy_data, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)",
				tenantID,
				"access_config",
				accessPolicyData,
				now,
				now,
			)
		}
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	// Log audit event
	_, _ = getDB(ctx).Exec(ctx,
		"INSERT INTO public.audit_log (event_type, user_id, details, created_at) VALUES ($1, $2, $3, $4)",
		"tenant_created",
		claims["sub"].(string),
		fmt.Sprintf(`{"tenant_id": "%s", "company_name": "%s", "agents": %v}`, tenantID, req.Company.Name, req.AgentSelection.SelectedAgents),
		now,
	)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"tenantID": tenantID,
	})
}

// Bootstrap Kit Handler
func handleBootstrapKit(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Force bypass for development
	if os.Getenv("BYPASS_OCT") == "true" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"ok":          true,
			"fingerprint": "sha256:mock-fingerprint-" + uuid.New().String()[:16],
			"size":        1024,
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

	// Get tenant ID from query parameter
	tenantID := r.URL.Query().Get("tenantId")

	// If no tenantId in query, check if we have full tenant data in body
	var tenantRequest *CreateTenantRequest
	if tenantID == "" && r.Body != nil {
		// Read body (we'll need it for tenant creation if needed)
		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			log.Printf("Failed to read request body: %v", err)
		}

		if len(bodyBytes) > 0 {
			var req CreateTenantRequest
			if err := json.Unmarshal(bodyBytes, &req); err == nil {
				tenantRequest = &req
				// Try to find existing tenant by email
				err := getDB(ctx).QueryRow(ctx,
					"SELECT id FROM public.tenants WHERE email = $1 ORDER BY created_at DESC LIMIT 1",
					req.Company.Email,
				).Scan(&tenantID)
				if err != nil {
					// Tenant doesn't exist, we'll create it below
					tenantID = ""
				}
			}
		}
	}

	// If still no tenantID, create tenant from request data
	if tenantID == "" {
		if tenantRequest == nil {
			// Try to get most recent tenant as fallback
			err := getDB(ctx).QueryRow(ctx,
				"SELECT id FROM public.tenants ORDER BY created_at DESC LIMIT 1",
			).Scan(&tenantID)
			if err != nil {
				http.Error(w, "No tenant found and no tenant data provided. Please create a tenant first.", http.StatusBadRequest)
				return
			}
		} else {
			// Create tenant from request data
			// (Reuse handleCreateTenant logic but simplified)
			newTenantID := uuid.New().String()
			now := time.Now()

			domain := tenantRequest.Company.Domain
			if domain == nil || *domain == "" {
				emailParts := strings.Split(tenantRequest.Company.Email, "@")
				if len(emailParts) == 2 {
					domainStr := emailParts[1]
					domain = &domainStr
				}
			}

			primaryRegion := ""
			if len(tenantRequest.DataRegionsConfig.SelectedRegions) > 0 {
				primaryRegion = tenantRequest.DataRegionsConfig.SelectedRegions[0]
			}

			configData, _ := json.Marshal(tenantRequest)

			_, err := getDB(ctx).Exec(ctx,
				"INSERT INTO public.tenants (id, name, domain, region, config_data, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
				newTenantID, tenantRequest.Company.Name, domain, primaryRegion, configData, "pending", now, now,
			)

			if err != nil {
				http.Error(w, fmt.Sprintf("Failed to create tenant: %v", err), http.StatusInternalServerError)
				return
			}

			tenantID = newTenantID
		}
	}

	// Fetch tenant data
	var tenantName, tenantEmail, tenantDomain, tenantRegion string
	var configData []byte
	err = getDB(ctx).QueryRow(ctx,
		"SELECT name, email, domain, region, config_data FROM public.tenants WHERE id = $1",
		tenantID,
	).Scan(&tenantName, &tenantEmail, &tenantDomain, &tenantRegion, &configData)

	if err != nil {
		http.Error(w, "Tenant not found", http.StatusNotFound)
		return
	}

	// Parse tenant config
	var tenantConfig CreateTenantRequest
	if err := json.Unmarshal(configData, &tenantConfig); err != nil {
		http.Error(w, "Invalid tenant configuration", http.StatusInternalServerError)
		return
	}

	// Fetch selected agents
	var agents []string
	rows, err := getDB(ctx).Query(ctx,
		"SELECT agent_id FROM public.tenant_agents WHERE tenant_id = $1",
		tenantID,
	)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var agentID string
			if err := rows.Scan(&agentID); err == nil {
				agents = append(agents, agentID)
			}
		}
	}
	// Fallback to config if no agents in junction table
	if len(agents) == 0 {
		agents = tenantConfig.AgentSelection.SelectedAgents
	}

	// Phase 12: Fetch federation metadata
	federationMetadata := make(map[string]interface{})
	var primaryNodeID, primaryRegion string
	var federationMetaJSON []byte
	err = getDB(ctx).QueryRow(ctx,
		`SELECT primary_node_id, primary_region, federation_metadata 
		 FROM public.tenant_federation_map 
		 WHERE tenant_id = $1`,
		tenantID,
	).Scan(&primaryNodeID, &primaryRegion, &federationMetaJSON)

	if err == nil {
		federationMetadata["primaryNodeId"] = primaryNodeID
		federationMetadata["primaryRegion"] = primaryRegion
		if len(federationMetaJSON) > 0 {
			var meta map[string]interface{}
			if err := json.Unmarshal(federationMetaJSON, &meta); err == nil {
				federationMetadata["metadata"] = meta
			}
		}
	}

	// Build tenant info for kit generation
	tenantInfo := bootstrap.TenantInfo{
		ID:      tenantID,
		Name:    tenantName,
		Email:   tenantEmail,
		Domain:  tenantDomain,
		Region:  tenantRegion,
		Agents:  agents,
		Regions: tenantConfig.DataRegionsConfig.SelectedRegions,
		Config: map[string]interface{}{
			"federation": federationMetadata,
		},
		Sensitivity: func() string {
			if tenantConfig.DataRegionsConfig.Sensitivity != nil {
				return *tenantConfig.DataRegionsConfig.Sensitivity
			}
			return "None"
		}(),
		Access: bootstrap.AccessConfig{
			AuthMethod: tenantConfig.AccessConfig.AuthMethod,
			AdminEmail: func() string {
				if tenantConfig.AccessConfig.AdminEmail != nil {
					return *tenantConfig.AccessConfig.AdminEmail
				}
				return ""
			}(),
			ClientId: func() string {
				if tenantConfig.AccessConfig.ClientId != nil {
					return *tenantConfig.AccessConfig.ClientId
				}
				return ""
			}(),
			ClientSecret: func() string {
				if tenantConfig.AccessConfig.ClientSecret != nil {
					return *tenantConfig.AccessConfig.ClientSecret
				}
				return ""
			}(),
			CallbackUrl: func() string {
				if tenantConfig.AccessConfig.CallbackUrl != nil {
					return *tenantConfig.AccessConfig.CallbackUrl
				}
				return ""
			}(),
			ScimEnabled: tenantConfig.AccessConfig.ScimEnabled,
			IdentityProvider: func() string {
				if tenantConfig.AccessConfig.IdentityProvider != nil {
					return *tenantConfig.AccessConfig.IdentityProvider
				}
				return ""
			}(),
		},
	}

	// Generate bootstrap kit
	kit, err := bootstrap.GenerateBootstrapKit(tenantInfo)
	if err != nil {
		log.Printf("Failed to generate bootstrap kit: %v", err)
		http.Error(w, fmt.Sprintf("Failed to generate bootstrap kit: %v", err), http.StatusInternalServerError)
		return
	}

	// Store kit in database
	now := time.Now()
	expiresAt := now.Add(15 * time.Minute) // 15 minute expiry
	_, err = getDB(ctx).Exec(ctx,
		"INSERT INTO public.bootstrap_kits (tenant_id, fingerprint, kit_data, created_at, expires_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (fingerprint) DO UPDATE SET kit_data = $3, expires_at = $5",
		tenantID,
		kit.Fingerprint,
		kit.ZIPData,
		now,
		expiresAt,
	)

	// Phase 11: Log kit generation activity
	if err == nil {
		go RecordActivityEvent(ctx, tenantID, ActivityEventKitGenerated,
			"Bootstrap kit generated",
			fmt.Sprintf("Kit fingerprint: %s", kit.Fingerprint),
			ActivitySeveritySuccess,
			map[string]interface{}{
				"fingerprint": kit.Fingerprint,
				"size":        kit.Size,
			})
	}

	if err != nil {
		log.Printf("Failed to store bootstrap kit: %v", err)
		// Continue anyway - kit is generated, just not stored
	}

	// Log KIT_GENERATED event
	clientIP := GetClientIP(r)
	userAgent := r.Header.Get("User-Agent")
	go RecordAuditEvent(ctx, tenantID, string(AuditActionKitGenerated), kit.Fingerprint, clientIP, userAgent)

	// Log KIT_DOWNLOADED event (since this endpoint both generates and downloads)
	go RecordAuditEvent(ctx, tenantID, string(AuditActionKitDownloaded), kit.Fingerprint, clientIP, userAgent)

	// Return ZIP file
	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=bootstrap-%s.zip", tenantID[:8]))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", kit.Size))
	w.Write(kit.ZIPData)
}

// Bootstrap Meta Handler
func handleBootstrapMeta(w http.ResponseWriter, r *http.Request) {
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

	// Get tenant ID from URL parameter
	tenantID := chi.URLParam(r, "tenantId")
	if tenantID == "" {
		http.Error(w, "tenantId parameter is required", http.StatusBadRequest)
		return
	}

	// Fetch bootstrap kit for tenant
	var fingerprint string
	var createdAt time.Time
	err = getDB(ctx).QueryRow(ctx,
		"SELECT fingerprint, created_at FROM public.bootstrap_kits WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 1",
		tenantID,
	).Scan(&fingerprint, &createdAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Bootstrap kit not found for this tenant", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Return bootstrap metadata
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"fingerprint":   fingerprint,
		"verifyCommand": fmt.Sprintf("sage verify-kit --tenant %s --fingerprint %s", tenantID, fingerprint),
		"downloadUrl":   "/api/onboarding/bootstrap/kit?tenantId=" + tenantID,
		"createdAt":     createdAt.Format(time.RFC3339),
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

// List Agents Handler
func handleListAgents(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Try to fetch from database with capabilities and requirements
	var agents []map[string]interface{}

	rows, err := getDB(ctx).Query(ctx, "SELECT id, name, description, capabilities, requirements FROM public.agents ORDER BY id")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var id, name, description string
			var capabilities, requirements []byte
			if err := rows.Scan(&id, &name, &description, &capabilities, &requirements); err == nil {
				agent := map[string]interface{}{
					"id":          id,
					"name":        name,
					"description": description,
				}
				
				// Parse capabilities JSONB
				if len(capabilities) > 0 {
					var caps interface{}
					if err := json.Unmarshal(capabilities, &caps); err == nil {
						agent["capabilities"] = caps
					} else {
						// Default capabilities based on agent type
						agent["capabilities"] = getDefaultCapabilities(id)
					}
				} else {
					agent["capabilities"] = getDefaultCapabilities(id)
				}
				
				// Parse requirements JSONB
				if len(requirements) > 0 {
					var reqs interface{}
					if err := json.Unmarshal(requirements, &reqs); err == nil {
						agent["requirements"] = reqs
					} else {
						// Default requirements
						agent["requirements"] = getDefaultRequirements(id)
					}
				} else {
					agent["requirements"] = getDefaultRequirements(id)
				}
				
				agents = append(agents, agent)
			}
		}
	}

	// Fallback to hardcoded list if database query fails or returns no results
	if len(agents) == 0 {
		agents = []map[string]interface{}{
			{
				"id":          "researcher",
				"name":        "Researcher Agent",
				"description": "Data gathering + external retrieval",
				"capabilities": getDefaultCapabilities("researcher"),
				"requirements": getDefaultRequirements("researcher"),
			},
			{
				"id":          "audit-logger",
				"name":        "Audit Logger",
				"description": "Immutable compliance logging",
				"capabilities": getDefaultCapabilities("audit-logger"),
				"requirements": getDefaultRequirements("audit-logger"),
			},
			{
				"id":          "etl-lite",
				"name":        "ETL-Lite",
				"description": "Basic data processing and ingestion",
				"capabilities": getDefaultCapabilities("etl-lite"),
				"requirements": getDefaultRequirements("etl-lite"),
			},
			{
				"id":          "notification-relay",
				"name":        "Notification Relay",
				"description": "Alerts + async messaging",
				"capabilities": getDefaultCapabilities("notification-relay"),
				"requirements": getDefaultRequirements("notification-relay"),
			},
			{
				"id":          "observer",
				"name":        "Observer Agent",
				"description": "Passive telemetry + drift detection",
				"capabilities": getDefaultCapabilities("observer"),
				"requirements": getDefaultRequirements("observer"),
			},
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"agents": agents,
	})
}

// Helper function to get default capabilities for an agent
func getDefaultCapabilities(agentID string) []string {
	capabilities := map[string][]string{
		"researcher":       {"data-retrieval", "external-api", "web-scraping"},
		"audit-logger":     {"compliance-logging", "immutable-audit", "event-tracking"},
		"etl-lite":         {"data-processing", "data-ingestion", "transformation"},
		"notification-relay": {"alerting", "messaging", "async-communication"},
		"observer":         {"telemetry", "drift-detection", "monitoring"},
	}
	if caps, ok := capabilities[agentID]; ok {
		return caps
	}
	return []string{}
}

// Helper function to get default requirements for an agent
func getDefaultRequirements(agentID string) map[string]interface{} {
	requirements := map[string]map[string]interface{}{
		"audit-logger": {
			"requiredAgents": []string{},
			"requiredCapabilities": []string{"compliance-logging"},
			"minRegions": 1,
		},
		"researcher": {
			"requiredAgents": []string{},
			"requiredCapabilities": []string{},
			"minRegions": 0,
		},
		"etl-lite": {
			"requiredAgents": []string{},
			"requiredCapabilities": []string{},
			"minRegions": 0,
		},
		"notification-relay": {
			"requiredAgents": []string{},
			"requiredCapabilities": []string{},
			"minRegions": 0,
		},
		"observer": {
			"requiredAgents": []string{},
			"requiredCapabilities": []string{},
			"minRegions": 0,
		},
	}
	if reqs, ok := requirements[agentID]; ok {
		return reqs
	}
	return map[string]interface{}{
		"requiredAgents":      []string{},
		"requiredCapabilities": []string{},
		"minRegions":          0,
	}
}

// List Regions Handler
func handleListRegions(w http.ResponseWriter, r *http.Request) {
	regions := []map[string]interface{}{
		{
			"id":          "us-east",
			"name":        "US-East",
			"location":    "United States (East Coast)",
			"compliance":  []string{"SOC2", "HIPAA", "PCI-DSS"},
			"allowedSensitivity": []string{"None", "PCI", "PHI / HIPAA", "High Confidential"},
		},
		{
			"id":          "us-west",
			"name":        "US-West",
			"location":    "United States (West Coast)",
			"compliance":  []string{"SOC2", "HIPAA", "PCI-DSS"},
			"allowedSensitivity": []string{"None", "PCI", "PHI / HIPAA", "High Confidential"},
		},
		{
			"id":          "eu",
			"name":        "EU",
			"location":    "Europe",
			"compliance":  []string{"GDPR", "SOC2", "ISO27001"},
			"allowedSensitivity": []string{"None", "High Confidential"},
		},
		{
			"id":          "apac",
			"name":        "APAC",
			"location":    "Asia Pacific",
			"compliance":  []string{"SOC2", "ISO27001"},
			"allowedSensitivity": []string{"None", "High Confidential"},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"regions": regions,
	})
}

// Bootstrap Verify Handler
// Tenant Telemetry Handler
func handleTenantTelemetry(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Verify OCT token (with bypass for development)
	if os.Getenv("BYPASS_OCT") != "true" {
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
	}

	// Get tenant ID from URL parameter
	tenantID := chi.URLParam(r, "tenantId")
	if tenantID == "" {
		http.Error(w, "tenantId parameter is required", http.StatusBadRequest)
		return
	}

	// Fetch tenant data
	var companyName string
	err := getDB(ctx).QueryRow(ctx,
		"SELECT name FROM public.tenants WHERE id = $1",
		tenantID,
	).Scan(&companyName)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Tenant not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Count agents for this tenant
	var agentCount int
	err = getDB(ctx).QueryRow(ctx,
		"SELECT COUNT(*) FROM public.tenant_agents WHERE tenant_id = $1",
		tenantID,
	).Scan(&agentCount)

	if err != nil {
		agentCount = 0 // Default to 0 on error
	}

	// Fetch selected agent IDs
	var selectedAgents []map[string]string
	rows, err := getDB(ctx).Query(ctx,
		"SELECT ta.agent_id, a.name FROM public.tenant_agents ta JOIN public.agents a ON ta.agent_id = a.id WHERE ta.tenant_id = $1",
		tenantID,
	)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var agentID, agentName string
			if err := rows.Scan(&agentID, &agentName); err == nil {
				selectedAgents = append(selectedAgents, map[string]string{
					"id":   agentID,
					"name": agentName,
				})
			}
		}
	}

	// Determine bootstrap status
	var bootstrapStatus string
	var activatedAt sql.NullTime
	var expiresAt sql.NullTime
	err = getDB(ctx).QueryRow(ctx,
		"SELECT activated_at, expires_at FROM public.bootstrap_kits WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 1",
		tenantID,
	).Scan(&activatedAt, &expiresAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			bootstrapStatus = "pending"
		} else {
			bootstrapStatus = "pending" // Default on error
		}
	} else {
		if activatedAt.Valid {
			bootstrapStatus = "activated"
		} else if expiresAt.Valid && expiresAt.Time.Before(time.Now()) {
			bootstrapStatus = "expired"
		} else {
			bootstrapStatus = "issued"
		}
	}

	// Compute signal strength heuristic
	// Higher if activated + more agents
	signalStrength := 30 // Base
	if bootstrapStatus == "activated" {
		signalStrength += 40
	}
	signalStrength += agentCount * 5
	if signalStrength > 100 {
		signalStrength = 100
	}

	// Compute rotation ETA (deterministic based on tenant ID hash)
	// This ensures it's consistent across refreshes
	rotationETA := "~12 hours" // Placeholder, but deterministic

	// Calculate health score (0-100)
	healthScore := 100
	if bootstrapStatus == "expired" {
		healthScore -= 20
	} else if bootstrapStatus == "pending" {
		healthScore -= 10
	}
	if agentCount == 0 {
		healthScore -= 15
	}
	if signalStrength < 50 {
		healthScore -= 10
	}
	if healthScore < 0 {
		healthScore = 0
	}

	// Generate alerts based on status
	var alerts []map[string]interface{}
	if bootstrapStatus == "expired" {
		alerts = append(alerts, map[string]interface{}{
			"severity": "warning",
			"message":  "Bootstrap kit has expired",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	}
	if agentCount == 0 {
		alerts = append(alerts, map[string]interface{}{
			"severity": "info",
			"message":  "No agents deployed yet",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	}

	// Generate signals (system events)
	var signals []map[string]interface{}
	if bootstrapStatus == "activated" {
		signals = append(signals, map[string]interface{}{
			"type":      "bootstrap.activated",
			"timestamp": time.Now().Format(time.RFC3339),
			"value":     "Bootstrap kit verified and activated",
		})
	}
	if agentCount > 0 {
		signals = append(signals, map[string]interface{}{
			"type":      "agents.deployed",
			"timestamp": time.Now().Format(time.RFC3339),
			"value":     fmt.Sprintf("%d agents configured", agentCount),
		})
	}

	// Format last signal timestamp
	lastSignal := time.Now().Format(time.RFC3339)
	if len(signals) > 0 {
		lastSignal = signals[0]["timestamp"].(string)
	}

	// Return enhanced telemetry data (Phase 8)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"agentCount":  agentCount,
		"lastSignal":  lastSignal,
		"rotationEta": rotationETA,
		"healthScore": healthScore,
		"alerts":      alerts,
		"signals":     signals,
	})
}

// Tenant Status Handler (Phase 7 Enhanced)
func handleTenantStatus(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Verify OCT token (with bypass for development)
	if os.Getenv("BYPASS_OCT") != "true" {
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
	}

	// Get tenant ID from URL parameter
	tenantID := chi.URLParam(r, "tenantId")
	if tenantID == "" {
		http.Error(w, "tenantId parameter is required", http.StatusBadRequest)
		return
	}

	// Fetch tenant core data
	var createdAt time.Time
	err := getDB(ctx).QueryRow(ctx,
		"SELECT created_at FROM public.tenants WHERE id = $1",
		tenantID,
	).Scan(&createdAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Tenant not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Fetch bootstrap status
	var bootstrapGenerated bool
	var bootstrapFingerprint sql.NullString
	var bootstrapCreatedAt sql.NullTime
	var bootstrapActivatedAt sql.NullTime
	var bootstrapExpiresAt sql.NullTime

	err = getDB(ctx).QueryRow(ctx,
		"SELECT fingerprint, created_at, activated_at, expires_at FROM public.bootstrap_kits WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 1",
		tenantID,
	).Scan(&bootstrapFingerprint, &bootstrapCreatedAt, &bootstrapActivatedAt, &bootstrapExpiresAt)

	bootstrapGenerated = (err == nil)
	bootstrapActivated := bootstrapActivatedAt.Valid
	bootstrapExpired := false
	if bootstrapExpiresAt.Valid {
		bootstrapExpired = time.Now().After(bootstrapExpiresAt.Time)
	}

	// Fetch agent status
	var agentDetails []map[string]interface{}
	var deployedCount, pendingCount, failedCount int

	rows, err := getDB(ctx).Query(ctx,
		`SELECT ta.agent_id, ta.status, a.name 
		 FROM public.tenant_agents ta 
		 LEFT JOIN public.agents a ON ta.agent_id = a.id 
		 WHERE ta.tenant_id = $1`,
		tenantID,
	)

	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var agentID, agentStatus, agentName string
			// Handle NULL status (default to 'pending' if migration not run yet)
			var status sql.NullString
			if err := rows.Scan(&agentID, &status, &agentName); err == nil {
				if !status.Valid {
					agentStatus = "pending"
				} else {
					agentStatus = status.String
				}

				// Count by status
				switch agentStatus {
				case "deployed":
					deployedCount++
				case "failed":
					failedCount++
				default:
					pendingCount++
				}

				agentDetails = append(agentDetails, map[string]interface{}{
					"id":     agentID,
					"name":   agentName,
					"status": agentStatus,
				})
			}
		}
	}

	// Format bootstrap fingerprint
	var fingerprintStr *string
	if bootstrapFingerprint.Valid {
		fp := bootstrapFingerprint.String
		fingerprintStr = &fp
	}

	// Federation state (stub for now - ready for future integration)
	federationReady := false
	var federationLastSeen *string
	nodeConnected := false

	// TODO: Integrate with SAGE cluster API when available
	// For now, return stub values structured for easy future enhancement

	// Determine regions ready status (check if tenant has region config)
	var regionsReady bool
	var regionCount int
	err = getDB(ctx).QueryRow(ctx,
		"SELECT COUNT(*) FROM public.tenants WHERE id = $1 AND data_regions IS NOT NULL",
		tenantID,
	).Scan(&regionCount)
	regionsReady = (err == nil && regionCount > 0)

	// Determine cluster health
	clusterHealth := "nominal"
	if failedCount > 0 {
		clusterHealth = "degraded"
	}
	if failedCount > deployedCount {
		clusterHealth = "critical"
	}
	if !bootstrapActivated {
		clusterHealth = "initializing"
	}

	// Return enhanced status data (Phase 8 compatible)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"bootstrap": map[string]interface{}{
			"generated": bootstrapGenerated,
			"verified":  bootstrapActivated,
		},
		"agentsReady":   deployedCount > 0,
		"regionsReady":  regionsReady,
		"clusterHealth": clusterHealth,
		// Also include Phase 7 structure for backward compatibility
		"tenantId": tenantID,
		"activation": map[string]interface{}{
			"createdAt":           createdAt.Format(time.RFC3339),
			"bootstrapGenerated":  bootstrapGenerated,
			"bootstrapFingerprint": fingerprintStr,
			"bootstrapActivated":  bootstrapActivated,
			"bootstrapExpired":     bootstrapExpired,
		},
		"agents": map[string]interface{}{
			"count":   deployedCount + pendingCount + failedCount,
			"deployed": deployedCount,
			"pending":  pendingCount,
			"failed":   failedCount,
			"details": agentDetails,
		},
		"federation": map[string]interface{}{
			"ready":        federationReady,
			"lastSeen":     federationLastSeen,
			"nodeConnected": nodeConnected,
		},
	})
}

// Bootstrap Audit Handler
func handleBootstrapAudit(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Verify OCT token (with bypass for development)
	if os.Getenv("BYPASS_OCT") != "true" {
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
	}

	// Get tenant ID from URL parameter
	tenantID := chi.URLParam(r, "tenantId")
	if tenantID == "" {
		http.Error(w, "tenantId parameter is required", http.StatusBadRequest)
		return
	}

	// Query audit events
	events, err := QueryAuditEvents(ctx, tenantID)
	if err != nil {
		log.Printf("Failed to query audit events: %v", err)
		http.Error(w, "Failed to retrieve audit log", http.StatusInternalServerError)
		return
	}

	// Return audit events
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"events": events,
	})
}

// Tenant Activity Handler
func handleTenantActivity(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Verify OCT token (with bypass for development)
	if os.Getenv("BYPASS_OCT") != "true" {
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
	}

	// Get tenant ID from URL parameter
	tenantID := chi.URLParam(r, "tenantId")
	if tenantID == "" {
		http.Error(w, "tenantId parameter is required", http.StatusBadRequest)
		return
	}

	// Verify tenant exists
	var companyName string
	var createdAt time.Time
	err := getDB(ctx).QueryRow(ctx,
		"SELECT name, created_at FROM public.tenants WHERE id = $1",
		tenantID,
	).Scan(&companyName, &createdAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Tenant not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Build activity events from real data
	var events []map[string]interface{}

	// Event 1: Tenant created
	events = append(events, map[string]interface{}{
		"id":        fmt.Sprintf("evt-%s-created", tenantID[:8]),
		"timestamp":  createdAt.Format(time.RFC3339),
		"type":      "tenant.created",
		"summary":   "Tenant registered",
		"detail":    fmt.Sprintf("%s onboarded into SAGE Federation Onboarding", companyName),
		"severity":  "info",
	})

	// Fetch bootstrap kit events
	rows, err := getDB(ctx).Query(ctx,
		"SELECT fingerprint, created_at, activated_at FROM public.bootstrap_kits WHERE tenant_id = $1 ORDER BY created_at DESC",
		tenantID,
	)
	if err == nil {
		defer rows.Close()
		eventID := 2
		for rows.Next() {
			var fingerprint string
			var kitCreatedAt time.Time
			var activatedAt sql.NullTime

			if err := rows.Scan(&fingerprint, &kitCreatedAt, &activatedAt); err == nil {
				// Bootstrap kit issued event
				events = append(events, map[string]interface{}{
					"id":        fmt.Sprintf("evt-%s-kit-%d", tenantID[:8], eventID),
					"timestamp":  kitCreatedAt.Format(time.RFC3339),
					"type":      "bootstrap.issued",
					"summary":   "Bootstrap kit generated",
					"detail":    fmt.Sprintf("Kit fingerprint sha256:%s", fingerprint[:16]),
					"severity":  "info",
				})
				eventID++

				// Bootstrap kit activated event (if activated)
				if activatedAt.Valid {
					events = append(events, map[string]interface{}{
						"id":        fmt.Sprintf("evt-%s-activated-%d", tenantID[:8], eventID),
						"timestamp":  activatedAt.Time.Format(time.RFC3339),
						"type":      "bootstrap.activated",
						"summary":   "Bootstrap kit activated",
						"detail":    fmt.Sprintf("Kit verified and activated for %s", companyName),
						"severity":  "success",
					})
					eventID++
				}
			}
		}
	}

	// Sort events by timestamp (newest first)
	// Events are already in chronological order from DB, but reverse for newest first
	for i, j := 0, len(events)-1; i < j; i, j = i+1, j-1 {
		events[i], events[j] = events[j], events[i]
	}

	// Return Phase 8 activity data
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"events": events,
	})
}

// Tenant Agents Handler (Phase 8)
func handleTenantAgents(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Verify OCT token (with bypass for development)
	if os.Getenv("BYPASS_OCT") != "true" {
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
	}

	// Get tenant ID from URL parameter
	tenantID := chi.URLParam(r, "tenantId")
	if tenantID == "" {
		http.Error(w, "tenantId parameter is required", http.StatusBadRequest)
		return
	}

	// Verify tenant exists
	err := getDB(ctx).QueryRow(ctx,
		"SELECT id FROM public.tenants WHERE id = $1",
		tenantID,
	).Scan(&tenantID)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Tenant not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Fetch agents with status
	var agents []map[string]interface{}
	rows, err := getDB(ctx).Query(ctx,
		`SELECT ta.agent_id, COALESCE(ta.status, 'pending') as status, a.name 
		 FROM public.tenant_agents ta 
		 LEFT JOIN public.agents a ON ta.agent_id = a.id 
		 WHERE ta.tenant_id = $1
		 ORDER BY ta.created_at DESC`,
		tenantID,
	)

	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var agentID, agentStatus, agentName string
			if err := rows.Scan(&agentID, &agentStatus, &agentName); err == nil {
				agents = append(agents, map[string]interface{}{
					"id":     agentID,
					"status": agentStatus,
				})
			}
		}
	}

	// Return agents data
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"agents": agents,
	})
}

// Bootstrap Status Handler (Phase 9)
func handleBootstrapStatus(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Get tenant ID from URL parameter
	tenantID := chi.URLParam(r, "tenantId")
	if tenantID == "" {
		http.Error(w, "tenantId parameter is required", http.StatusBadRequest)
		return
	}

	// Fetch latest bootstrap kit for tenant
	var fingerprint sql.NullString
	var activatedAt sql.NullTime
	var createdAt sql.NullTime
	var expiresAt sql.NullTime

	err := getDB(ctx).QueryRow(ctx,
		"SELECT fingerprint, activated_at, created_at, expires_at FROM public.bootstrap_kits WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 1",
		tenantID,
	).Scan(&fingerprint, &activatedAt, &createdAt, &expiresAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// No kit exists yet
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"tenantId":    tenantID,
				"fingerprint": nil,
				"activated":   false,
				"activatedAt": nil,
				"createdAt":   nil,
				"expiresAt":   nil,
			})
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Format response
	var fingerprintStr *string
	if fingerprint.Valid {
		fp := fingerprint.String
		fingerprintStr = &fp
	}

	var activatedAtStr *string
	if activatedAt.Valid {
		at := activatedAt.Time.Format(time.RFC3339)
		activatedAtStr = &at
	}

	var createdAtStr *string
	if createdAt.Valid {
		ct := createdAt.Time.Format(time.RFC3339)
		createdAtStr = &ct
	}

	var expiresAtStr *string
	if expiresAt.Valid {
		et := expiresAt.Time.Format(time.RFC3339)
		expiresAtStr = &et
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"tenantId":    tenantID,
		"fingerprint": fingerprintStr,
		"activated":   activatedAt.Valid,
		"activatedAt": activatedAtStr,
		"createdAt":   createdAtStr,
		"expiresAt":   expiresAtStr,
	})
}

// Bootstrap Scan Handler (Phase 9 - QR Code Verification)
func handleBootstrapScan(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	fingerprint := r.URL.Query().Get("fingerprint")
	if fingerprint == "" {
		http.Error(w, "fingerprint parameter is required", http.StatusBadRequest)
		return
	}

	// Check if fingerprint exists and get tenant ID
	var tenantID string
	var activatedAt sql.NullTime
	var expiresAt sql.NullTime

	err := getDB(ctx).QueryRow(ctx,
		"SELECT tenant_id, activated_at, expires_at FROM public.bootstrap_kits WHERE fingerprint = $1",
		fingerprint,
	).Scan(&tenantID, &activatedAt, &expiresAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"valid":      false,
				"tenantId":   nil,
				"activation": "invalid",
			})
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Check if expired
	if expiresAt.Valid && expiresAt.Time.Before(time.Now()) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"valid":      false,
			"tenantId":   tenantID,
			"activation": "expired",
		})
		return
	}

	// If not activated, activate it now
	if !activatedAt.Valid {
		_, err := getDB(ctx).Exec(ctx,
			"UPDATE public.bootstrap_kits SET activated_at = NOW() WHERE fingerprint = $1",
			fingerprint,
		)
		if err != nil {
			log.Printf("Failed to activate bootstrap kit: %v", err)
			http.Error(w, "Failed to activate kit", http.StatusInternalServerError)
			return
		}

		// Log successful verification
		go RecordAuditEvent(ctx, tenantID, string(AuditActionVerifySuccess), fingerprint, GetClientIP(r), r.UserAgent())
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"valid":      true,
		"tenantId":   tenantID,
		"activation": "success",
	})
}

func handleBootstrapVerify(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req struct {
		Fingerprint string `json:"fingerprint"`
		TenantID    string `json:"tenantId,omitempty"`
	}

	// Support both GET (query params) and POST (JSON body)
	if r.Method == "GET" {
		req.Fingerprint = r.URL.Query().Get("fingerprint")
		req.TenantID = r.URL.Query().Get("tenantId")
	} else {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}
	}

	if req.Fingerprint == "" {
		http.Error(w, "Fingerprint is required", http.StatusBadRequest)
		return
	}

	// Check if fingerprint exists in bootstrap_kits table
	var tenantID string
	var activatedAt sql.NullTime
	var expiresAt sql.NullTime

	query := "SELECT tenant_id, activated_at, expires_at FROM public.bootstrap_kits WHERE fingerprint = $1"
	var err error
	if req.TenantID != "" {
		query += " AND tenant_id = $2"
		err = getDB(ctx).QueryRow(ctx, query, req.Fingerprint, req.TenantID).Scan(&tenantID, &activatedAt, &expiresAt)
	} else {
		err = getDB(ctx).QueryRow(ctx, query, req.Fingerprint).Scan(&tenantID, &activatedAt, &expiresAt)
	}

	if err != nil {
		// Log failed verification
		clientIP := GetClientIP(r)
		userAgent := r.Header.Get("User-Agent")
		if req.TenantID != "" {
			go RecordAuditEvent(ctx, req.TenantID, string(AuditActionVerifyFailed), req.Fingerprint, clientIP, userAgent)
		}
		
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"valid":   false,
			"message": "Bootstrap kit fingerprint not found or invalid",
		})
		return
	}

	// Check if expired
	if expiresAt.Valid && time.Now().After(expiresAt.Time) {
		// Log failed verification (expired)
		clientIP := GetClientIP(r)
		userAgent := r.Header.Get("User-Agent")
		go RecordAuditEvent(ctx, tenantID, string(AuditActionVerifyFailed), req.Fingerprint, clientIP, userAgent)
		
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusGone)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"valid":   false,
			"message": "Bootstrap kit has expired",
		})
		return
	}

	// Mark as activated if not already activated (Phase 9 enhancement)
	if !activatedAt.Valid {
		now := time.Now()
		_, err := getDB(ctx).Exec(ctx,
			"UPDATE public.bootstrap_kits SET activated_at = $1 WHERE fingerprint = $2",
			now,
			req.Fingerprint,
		)
		if err != nil {
			log.Printf("Failed to mark kit as activated: %v", err)
			http.Error(w, "Failed to activate kit", http.StatusInternalServerError)
			return
		}
		// Update local variable for response
		activatedAt = sql.NullTime{Time: now, Valid: true}

		// Phase 11: Log kit verification activity
		go RecordActivityEvent(ctx, tenantID, ActivityEventKitVerified,
			"Bootstrap kit verified",
			fmt.Sprintf("Kit fingerprint verified and activated: %s", req.Fingerprint),
			ActivitySeveritySuccess,
			map[string]interface{}{
				"fingerprint": req.Fingerprint,
			})
	}

	// Log verification result (Phase 9 - ensure audit entry)
	clientIP := GetClientIP(r)
	userAgent := r.Header.Get("User-Agent")
	go RecordAuditEvent(ctx, tenantID, string(AuditActionVerifySuccess), req.Fingerprint, clientIP, userAgent)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"valid":     true,
		"message":   "Bootstrap kit fingerprint verified",
		"tenantId":  tenantID,
		"activated": activatedAt.Valid,
	})
}

// Phase 10: Identity Provider Detection
func handleListIdentityProviders(w http.ResponseWriter, r *http.Request) {
	// Return list of supported identity providers
	providers := []map[string]interface{}{
		{
			"id":          "okta",
			"name":        "Okta",
			"type":        "saml",
			"description": "Okta SSO integration",
			"features":    []string{"saml", "scim", "mfa"},
		},
		{
			"id":          "azure-ad",
			"name":        "Azure AD",
			"type":        "oidc",
			"description": "Microsoft Azure Active Directory",
			"features":    []string{"oidc", "scim", "mfa"},
		},
		{
			"id":          "google-workspace",
			"name":        "Google Workspace",
			"type":        "oidc",
			"description": "Google Workspace SSO",
			"features":    []string{"oidc", "scim"},
		},
		{
			"id":          "auth0",
			"name":        "Auth0",
			"type":        "oidc",
			"description": "Auth0 identity platform",
			"features":    []string{"oidc", "scim", "mfa"},
		},
		{
			"id":          "generic-oidc",
			"name":        "Generic OIDC",
			"type":        "oidc",
			"description": "Generic OpenID Connect provider",
			"features":    []string{"oidc"},
		},
		{
			"id":          "generic-saml",
			"name":        "Generic SAML",
			"type":        "saml",
			"description": "Generic SAML 2.0 provider",
			"features":    []string{"saml"},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"providers": providers,
	})
}

// Phase 10: Identity Validation
func handleValidateIdentity(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req struct {
		TenantID         string `json:"tenantId"`
		IdentityProvider string `json:"identityProvider"`
		ClientId         string `json:"clientId"`
		ClientSecret     string `json:"clientSecret"`
		CallbackUrl      string `json:"callbackUrl"`
		ScimEnabled      bool   `json:"scimEnabled"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.TenantID == "" {
		http.Error(w, "tenantId is required", http.StatusBadRequest)
		return
	}

	if req.IdentityProvider == "" {
		http.Error(w, "identityProvider is required", http.StatusBadRequest)
		return
	}

	if req.ClientId == "" {
		http.Error(w, "clientId is required", http.StatusBadRequest)
		return
	}

	if req.ClientSecret == "" {
		http.Error(w, "clientSecret is required", http.StatusBadRequest)
		return
	}

	if req.CallbackUrl == "" {
		http.Error(w, "callbackUrl is required", http.StatusBadRequest)
		return
	}

	// Validate callback URL format
	if !strings.HasPrefix(req.CallbackUrl, "http://") && !strings.HasPrefix(req.CallbackUrl, "https://") {
		http.Error(w, "callbackUrl must be a valid HTTP/HTTPS URL", http.StatusBadRequest)
		return
	}

	// Verify tenant exists
	var tenantExists bool
	err := getDB(ctx).QueryRow(ctx,
		"SELECT EXISTS(SELECT 1 FROM public.tenants WHERE id = $1)",
		req.TenantID,
	).Scan(&tenantExists)

	if err != nil || !tenantExists {
		http.Error(w, "Tenant not found", http.StatusNotFound)
		return
	}

	// TODO: In production, this would make actual API calls to validate credentials
	// For now, we'll do basic validation and simulate success
	validationResult := map[string]interface{}{
		"valid":            true,
		"tenantId":         req.TenantID,
		"identityProvider": req.IdentityProvider,
		"validatedAt":      time.Now().Format(time.RFC3339),
		"details": map[string]interface{}{
			"clientIdValid":    true,
			"clientSecretValid": true,
			"callbackUrlValid":  true,
			"scimAvailable":     req.ScimEnabled,
		},
	}

	// Store identity configuration in tenants table
	identityConfig := map[string]interface{}{
		"identityProvider": req.IdentityProvider,
		"clientId":         req.ClientId,
		"callbackUrl":      req.CallbackUrl,
		"scimEnabled":      req.ScimEnabled,
		"validatedAt":      time.Now().Format(time.RFC3339),
	}

	identityConfigJSON, _ := json.Marshal(identityConfig)

	_, err = getDB(ctx).Exec(ctx,
		`UPDATE public.tenants 
		 SET identity_provider = $1, 
		     identity_config = $2, 
		     identity_validated_at = $3,
		     updated_at = $4
		 WHERE id = $5`,
		req.IdentityProvider,
		identityConfigJSON,
		time.Now(),
		time.Now(),
		req.TenantID,
	)

	if err != nil {
		log.Printf("Failed to update tenant identity config: %v", err)
		http.Error(w, "Failed to save identity configuration", http.StatusInternalServerError)
		return
	}

	// Phase 11: Log identity validation activity
	go RecordActivityEvent(ctx, req.TenantID, ActivityEventIdentityValidated,
		"Identity configuration validated",
		fmt.Sprintf("SSO configured with %s", req.IdentityProvider),
		ActivitySeveritySuccess,
		map[string]interface{}{
			"identityProvider": req.IdentityProvider,
			"scimEnabled":       req.ScimEnabled,
		})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(validationResult)
}

// Phase 13.11: Agent Federation Handlers
// Agents authenticate using Ed25519 federation tokens

// Agent Telemetry Handler
// Agents send telemetry data to this endpoint
func handleAgentTelemetry(w http.ResponseWriter, r *http.Request) {
	// Get federation payload from middleware
	fedPayload := fedmw.GetFederationPayload(r)
	if fedPayload == nil {
		http.Error(w, "Federation payload not found", http.StatusInternalServerError)
		return
	}

	var telemetryData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&telemetryData); err != nil {
		http.Error(w, "Invalid telemetry data", http.StatusBadRequest)
		return
	}

	// Log telemetry receipt
	log.Printf("Agent telemetry received from node=%s tenant=%s", fedPayload.NodeID, fedPayload.TenantID)

	// Process telemetry data (store in database, forward to message mesh, etc.)
	// For now, just acknowledge receipt
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":      true,
		"nodeId":  fedPayload.NodeID,
		"tenantId": fedPayload.TenantID,
		"message": "Telemetry received",
	})
}

// Agent Commands Handler
// Agents receive commands from this endpoint
func handleAgentCommands(w http.ResponseWriter, r *http.Request) {
	// Get federation payload from middleware
	fedPayload := fedmw.GetFederationPayload(r)
	if fedPayload == nil {
		http.Error(w, "Federation payload not found", http.StatusInternalServerError)
		return
	}

	// Return pending commands for this agent/node
	// In a full implementation, this would query a command queue
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":       true,
		"nodeId":   fedPayload.NodeID,
		"tenantId": fedPayload.TenantID,
		"commands": []interface{}{}, // Empty for now
	})
}

// Agent Jobs Handler
// Agents submit job execution results to this endpoint
func handleAgentJobs(w http.ResponseWriter, r *http.Request) {
	// Get federation payload from middleware
	fedPayload := fedmw.GetFederationPayload(r)
	if fedPayload == nil {
		http.Error(w, "Federation payload not found", http.StatusInternalServerError)
		return
	}

	var jobData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&jobData); err != nil {
		http.Error(w, "Invalid job data", http.StatusBadRequest)
		return
	}

	// Process job results
	log.Printf("Agent job result received from node=%s tenant=%s", fedPayload.NodeID, fedPayload.TenantID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":       true,
		"nodeId":   fedPayload.NodeID,
		"tenantId": fedPayload.TenantID,
		"message":  "Job result received",
	})
}

// Agent Status Handler
// Agents can check their federation status
func handleAgentStatus(w http.ResponseWriter, r *http.Request) {
	// Get federation payload from middleware
	fedPayload := fedmw.GetFederationPayload(r)
	if fedPayload == nil {
		http.Error(w, "Federation payload not found", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":        true,
		"nodeId":    fedPayload.NodeID,
		"tenantId":  fedPayload.TenantID,
		"federated": true,
		"status":    "active",
	})
}

// Phase 13.11: Federation Bus Handler
// Secure messaging endpoint for the federation backplane
// Agents and nodes can send various message types through this unified endpoint
// Phase 14.5: All messages are recorded in the event stream
func handleFederationBus(w http.ResponseWriter, r *http.Request) {
	// Get federation payload from middleware
	fedPayload := fedmw.GetFederationPayload(r)
	if fedPayload == nil {
		http.Error(w, "Federation payload not found", http.StatusInternalServerError)
		return
	}

	var req struct {
		Type string                 `json:"type"`
		Data map[string]interface{} `json:"data"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Phase 14.6: Route message through central router
	// Extract nodeId from data if present, otherwise use federation payload
	nodeID := fedPayload.NodeID
	if dataNodeID, ok := req.Data["nodeId"].(string); ok && dataNodeID != "" {
		nodeID = dataNodeID
	}
	
	// Route message (includes event recording and internal routing)
	federation.RouteMessage(req.Type, nodeID, req.Data)

	// Phase 14.6: Response handling based on message type
	// Routing is handled by RouteMessage, here we just return appropriate responses
	switch req.Type {
	case "heartbeat":
		// Routing already handled by RouteMessage (includes UpdateNodeHeartbeat)
		log.Printf("Heartbeat received from node=%s tenant=%s", fedPayload.NodeID, fedPayload.TenantID)
		
		// Return success with status confirmation
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"ok":     true,
			"status": "alive",
		})
		return

	case "command":
		// Command routing already handled by RouteMessage (acknowledged, not executed)
		cmd, _ := req.Data["cmd"].(string)
		log.Printf("Command received from node=%s tenant=%s cmd=%s", fedPayload.NodeID, fedPayload.TenantID, cmd)
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"ok":      true,
			"accepted": true,
			"cmd":     cmd,
		})
		return

	case "telemetry":
		// Telemetry routing already handled by RouteMessage
		log.Printf("Telemetry received from node=%s tenant=%s", fedPayload.NodeID, fedPayload.TenantID)
		break

	case "event":
		// Event routing already handled by RouteMessage
		log.Printf("Event received from node=%s tenant=%s", fedPayload.NodeID, fedPayload.TenantID)
		break

	default:
		log.Printf("Unknown message type '%s' from node=%s tenant=%s", req.Type, fedPayload.NodeID, fedPayload.TenantID)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":       true,
		"nodeId":   fedPayload.NodeID,
		"tenantId": fedPayload.TenantID,
		"type":     req.Type,
	})
}

// Phase 14.2: List Federation Nodes Handler
// Exposes registered nodes for UI federation presence display
func handleListFederationNodes(w http.ResponseWriter, r *http.Request) {
	nodes := federation.GetNodes()
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"nodes": nodes,
	})
}

// Phase 14.3: Federation Nodes Status Handler
// Returns nodes with current timestamp for UI federation presence
func handleFederationNodesStatus(w http.ResponseWriter, r *http.Request) {
	nodes := federation.GetNodes()
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ts":    time.Now().UnixMilli(),
		"nodes": nodes,
	})
}

// Phase 14.5: Federation Events Handler
// Returns federation event stream for UI awareness and dashboards
func handleFederationEvents(w http.ResponseWriter, r *http.Request) {
	events := federation.GetEvents()
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"events": events,
	})
}
