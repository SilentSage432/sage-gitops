package main

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

var (
	dbPool     *pgxpool.Pool
	webAuthn   *webauthn.WebAuthn
	privateKey *rsa.PrivateKey
)

func main() {
	godotenv.Load()

	ctx := context.Background()

	// Initialize database connection
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Default connection - uses current user (silentsage) or sage_user
		// Override with DATABASE_URL env var if needed
		dbURL = "postgres://silentsage@localhost:5432/sage_os?search_path=public"
	}

	var err error
	dbPool, err = pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbPool.Close()

	// Test database connection
	if err := dbPool.Ping(ctx); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	// Initialize WebAuthn with v1 API
	webAuthnConfig := &webauthn.Config{
		RPDisplayName: "SAGE Onboarding",
		RPID:          "localhost",
		RPOrigins:     []string{"http://localhost:3000", "https://localhost:3000"},
	}

	webAuthn, err = webauthn.New(webAuthnConfig)
	if err != nil {
		log.Fatalf("Failed to initialize WebAuthn: %v", err)
	}

	// Generate or load RSA private key for JWT signing
	keyBytes := os.Getenv("JWT_PRIVATE_KEY")
	if keyBytes == "" {
		// Generate a new key for development
		privateKey, err = rsa.GenerateKey(rand.Reader, 2048)
		if err != nil {
			log.Fatalf("Failed to generate RSA key: %v", err)
		}
		log.Println("Generated new RSA key for JWT signing")
	} else {
		// Parse existing key (assumes PEM format directly or base64-encoded)
		keyData := []byte(keyBytes)

		// Try decoding as base64 first
		decoded, err := base64.StdEncoding.DecodeString(keyBytes)
		if err == nil {
			keyData = decoded
		}

		privateKey, err = jwt.ParseRSAPrivateKeyFromPEM(keyData)
		if err != nil {
			log.Fatalf("Failed to parse private key: %v", err)
		}
		log.Println("Loaded RSA private key from environment")
	}

	// Setup router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Routes
	r.Route("/v1/init/webauthn", func(r chi.Router) {
		r.Post("/challenge", handleWebAuthnChallenge)
		r.Post("/verify", handleWebAuthnVerify)
	})

	r.Route("/rho2/auth", func(r chi.Router) {
		r.Post("/issue", handleIssueOCT)
		r.Post("/verify", handleVerifyOCT)
	})

	// New standardized onboarding API routes
	r.Route("/api/onboarding", func(r chi.Router) {
		r.Post("/tenants", handleCreateTenant)
		r.Post("/bootstrap/kit", handleBootstrapKit)
		r.Get("/bootstrap/meta/{tenantId}", handleBootstrapMeta)
		r.Get("/bootstrap/status/{tenantId}", handleBootstrapStatus) // Phase 9
		r.Post("/bootstrap/verify", handleBootstrapVerify)
		r.Get("/bootstrap/verify", handleBootstrapVerify) // Also support GET for QR codes
		r.Get("/bootstrap/scan", handleBootstrapScan) // Phase 9 - QR verification
		r.Get("/agents", handleListAgents)
		r.Get("/regions", handleListRegions)
		
		// Phase 10: Identity/SSO endpoints
		r.Get("/identity/providers", handleListIdentityProviders)
		r.Post("/identity/validate", handleValidateIdentity)
		
		// Phase 3 & 8: Dashboard endpoints
		r.Route("/tenants/{tenantId}", func(r chi.Router) {
			r.Get("/telemetry", handleTenantTelemetry)
			r.Get("/status", handleTenantStatus)
			r.Get("/activity", handleTenantActivity)
			r.Get("/agents", handleTenantAgents) // Phase 8
		})
		
		// Phase 6: Bootstrap audit log
		r.Get("/bootstrap/audit/{tenantId}", handleBootstrapAudit)
		
		// Phase 6: Bootstrap audit log
		r.Get("/bootstrap/audit/{tenantId}", handleBootstrapAudit)
	})

	// Legacy routes (for backward compatibility)
	r.Post("/tenants", handleCreateTenant)
	r.Post("/bootstrap/kit", handleBootstrapKit)
	r.Get("/bootstrap/meta", handleBootstrapMeta)

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
