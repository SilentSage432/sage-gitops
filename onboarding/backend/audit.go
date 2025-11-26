package main

import (
	"context"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

// AuditAction represents the type of audit event
type AuditAction string

const (
	AuditActionKitGenerated  AuditAction = "KIT_GENERATED"
	AuditActionKitDownloaded AuditAction = "KIT_DOWNLOADED"
	AuditActionVerifySuccess AuditAction = "VERIFY_SUCCESS"
	AuditActionVerifyFailed   AuditAction = "VERIFY_FAILED"
)

// AuditEvent represents a single audit log entry
type AuditEvent struct {
	ID          string    `json:"id"`
	TenantID    string    `json:"tenantId"`
	Action      string    `json:"action"`
	Fingerprint string    `json:"fingerprint,omitempty"`
	IPAddress   string    `json:"ipAddress,omitempty"`
	UserAgent   string    `json:"userAgent,omitempty"`
	Timestamp  time.Time  `json:"timestamp"`
}

// RecordAuditEvent records an audit event in the database
func RecordAuditEvent(ctx context.Context, tenantID, action, fingerprint, ipAddress, userAgent string) error {
	if dbPool == nil {
		log.Printf("Warning: Database pool not initialized, skipping audit log")
		return nil
	}

	_, err := dbPool.Exec(ctx,
		`INSERT INTO public.bootstrap_kit_audit_log 
		 (id, tenant_id, action, fingerprint, ip_address, user_agent, timestamp) 
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		uuid.New().String(),
		tenantID,
		action,
		fingerprint,
		ipAddress,
		userAgent,
		time.Now(),
	)

	if err != nil {
		log.Printf("Failed to record audit event: %v", err)
		return err
	}

	return nil
}

// QueryAuditEvents retrieves audit events for a given tenant, ordered by timestamp descending
func QueryAuditEvents(ctx context.Context, tenantID string) ([]AuditEvent, error) {
	if dbPool == nil {
		return []AuditEvent{}, nil
	}

	rows, err := dbPool.Query(ctx,
		`SELECT id, tenant_id, action, fingerprint, ip_address, user_agent, timestamp 
		 FROM public.bootstrap_kit_audit_log 
		 WHERE tenant_id = $1 
		 ORDER BY timestamp DESC 
		 LIMIT 100`,
		tenantID,
	)

	if err != nil {
		log.Printf("Failed to query audit events: %v", err)
		return nil, err
	}
	defer rows.Close()

	var events []AuditEvent
	for rows.Next() {
		var event AuditEvent
		err := rows.Scan(
			&event.ID,
			&event.TenantID,
			&event.Action,
			&event.Fingerprint,
			&event.IPAddress,
			&event.UserAgent,
			&event.Timestamp,
		)
		if err != nil {
			log.Printf("Failed to scan audit event: %v", err)
			continue
		}
		events = append(events, event)
	}

	return events, nil
}

// GetClientIP extracts the client IP address from the request
// Checks X-Forwarded-For header first, then falls back to RemoteAddr
func GetClientIP(r *http.Request) string {
	// Check X-Forwarded-For header (for proxies/load balancers)
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		// X-Forwarded-For can contain multiple IPs, take the first one
		ips := strings.Split(forwarded, ",")
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}

	// Check X-Real-IP header (common in nginx)
	realIP := r.Header.Get("X-Real-IP")
	if realIP != "" {
		return strings.TrimSpace(realIP)
	}

	// Fall back to RemoteAddr
	ip := r.RemoteAddr
	// Remove port if present
	if idx := strings.LastIndex(ip, ":"); idx != -1 {
		ip = ip[:idx]
	}
	return ip
}

