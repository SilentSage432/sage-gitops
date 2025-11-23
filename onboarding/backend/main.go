package main

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	dbPool     *pgxpool.Pool
	webAuthn   *webauthn.WebAuthn
	privateKey *rsa.PrivateKey
)

func main() {
	ctx := context.Background()

	// Initialize database connection
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/sage_os?search_path=public"
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

	// Initialize WebAuthn
	webAuthnConfig := &webauthn.Config{
		RPDisplayName: "SAGE Onboarding",
		RPID:          "localhost",
		RPOrigins:     []string{"http://localhost:3000", "https://localhost:3000"},
		Timeouts: webauthn.TimeoutsConfig{
			Login: webauthn.TimeoutConfig{
				Enforce:    true,
				Timeout:    time.Second * 60,
				TimeoutUVI: time.Second * 0,
			},
			Registration: webauthn.TimeoutConfig{
				Enforce:    true,
				Timeout:    time.Second * 60,
				TimeoutUVI: time.Second * 0,
			},
		},
		AuthenticatorSelection: webauthn.AuthenticatorSelection{
			AuthenticatorAttachment: webauthn.CrossPlatform,
			UserVerification:        webauthn.VerificationRequired,
			RequireResidentKey:      false,
		},
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

