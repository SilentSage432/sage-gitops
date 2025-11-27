package main

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"

	fedmw "github.com/silentsage432/sage-gitops/onboarding/backend/middleware"
)

// SetupRouter sets up all routes including federation routes
func SetupRouter(dbPool *pgxpool.Pool) chi.Router {
	r := chi.NewRouter()

	// Middleware
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Tenant-ID", "X-Region", "X-Federation-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Initialize federation router
	federationRouter := fedmw.NewFederationRouter(dbPool)

	// Phase 13.1: Federation Auth Handshake API (stateless)
	// These routes are public - no session required
	r.Route("/api/federation/auth", func(r chi.Router) {
		r.Post("/handshake", handleFederationHandshake)
		r.Post("/assert", handleFederationAssert)
		r.Post("/verify", handleFederationVerify)
		// Phase 13.10: Node join endpoint for Pi bootstrap
		r.Post("/node/join", handleFederationNodeJoin)
		r.Get("/export", handleFederationExport)
		r.Post("/import", handleFederationImport)
	})

	// Phase 13.2: All protected federation APIs require valid session
	r.Route("/api/federation", func(r chi.Router) {
		r.Use(fedmw.RequireFederationSession)
		
		// Protected federation endpoints go here
		// Example: r.Get("/nodes", handleListFederationNodes)
		// Example: r.Post("/sync", handleFederationSync)
	})

	// Phase 13.11: Agent Federation API
	// Agents authenticate using Ed25519 federation tokens
	r.Route("/api/federation/agents", func(r chi.Router) {
		r.Use(fedmw.RequireAgentFederation)
		
		// Agent telemetry endpoint
		r.Post("/telemetry", handleAgentTelemetry)
		
		// Agent command endpoint (for receiving commands)
		r.Post("/commands", handleAgentCommands)
		
		// Agent job endpoint (for job execution)
		r.Post("/jobs", handleAgentJobs)
		
		// Agent status endpoint
		r.Get("/status", handleAgentStatus)
	})

	// Federation API routes (with federation middleware)
	r.Route("/federation/api", func(r chi.Router) {
		r.Use(federationRouter.FederationMiddleware)

		// Onboarding endpoints under federation
		r.Route("/onboarding", func(r chi.Router) {
			r.Post("/tenants", handleCreateTenant)
			r.Post("/bootstrap/kit", handleBootstrapKit)
			r.Get("/bootstrap/meta/{tenantId}", handleBootstrapMeta)
			r.Get("/bootstrap/status/{tenantId}", handleBootstrapStatus)
			r.Post("/bootstrap/verify", handleBootstrapVerify)
			r.Get("/bootstrap/verify", handleBootstrapVerify)
			r.Get("/bootstrap/scan", handleBootstrapScan)
			r.Get("/agents", handleListAgents)
			r.Get("/regions", handleListRegions)

			// Identity/SSO endpoints
			r.Get("/identity/providers", handleListIdentityProviders)
			r.Post("/identity/validate", handleValidateIdentity)

			// Dashboard endpoints
			r.Route("/tenants/{tenantId}", func(r chi.Router) {
				r.Get("/telemetry", handleTenantTelemetry)
				r.Get("/status", handleTenantStatus)
				r.Get("/activity", handleTenantActivity)
				r.Get("/agents", handleTenantAgents)
			})

			// Bootstrap audit log
			r.Get("/bootstrap/audit/{tenantId}", handleBootstrapAudit)
		})
	})

	// Legacy routes (backward compatibility - no federation middleware)
	r.Route("/v1/init/webauthn", func(r chi.Router) {
		r.Post("/challenge", handleWebAuthnChallenge)
		r.Post("/verify", handleWebAuthnVerify)
	})

	r.Route("/rho2/auth", func(r chi.Router) {
		r.Post("/issue", handleIssueOCT)
		r.Post("/verify", handleVerifyOCT)
	})

	// Standardized onboarding API routes (backward compatibility)
	r.Route("/api/onboarding", func(r chi.Router) {
		r.Post("/tenants", handleCreateTenant)
		r.Post("/bootstrap/kit", handleBootstrapKit)
		r.Get("/bootstrap/meta/{tenantId}", handleBootstrapMeta)
		r.Get("/bootstrap/status/{tenantId}", handleBootstrapStatus)
		r.Post("/bootstrap/verify", handleBootstrapVerify)
		r.Get("/bootstrap/verify", handleBootstrapVerify)
		r.Get("/bootstrap/scan", handleBootstrapScan)
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
			r.Get("/agents", handleTenantAgents)
		})

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

	return r
}

