package main

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/google/uuid"
)

// ActivityEventType represents the type of activity event
type ActivityEventType string

const (
	ActivityEventTenantCreated      ActivityEventType = "tenant.created"
	ActivityEventKitGenerated       ActivityEventType = "kit.generated"
	ActivityEventKitVerified        ActivityEventType = "kit.verified"
	ActivityEventSSOConfigured      ActivityEventType = "sso.configured"
	ActivityEventIdentityValidated  ActivityEventType = "identity.validated"
	ActivityEventAgentDeployed      ActivityEventType = "agent.deployed"
	ActivityEventRegionConfigured   ActivityEventType = "region.configured"
)

// ActivitySeverity represents the severity level of an activity event
type ActivitySeverity string

const (
	ActivitySeverityInfo    ActivitySeverity = "info"
	ActivitySeveritySuccess ActivitySeverity = "success"
	ActivitySeverityWarning ActivitySeverity = "warning"
	ActivitySeverityError   ActivitySeverity = "error"
)

// ActivityEvent represents a single activity log entry
type ActivityEvent struct {
	ID          string                 `json:"id"`
	TenantID    string                 `json:"tenantId"`
	EventType   string                 `json:"eventType"`
	Summary     string                 `json:"summary"`
	Detail      string                 `json:"detail,omitempty"`
	Severity    string                 `json:"severity"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	Timestamp   time.Time              `json:"timestamp"`
}

// RecordActivityEvent records an activity event in the database
func RecordActivityEvent(ctx context.Context, tenantID string, eventType ActivityEventType, summary, detail string, severity ActivitySeverity, metadata map[string]interface{}) error {
	if dbPool == nil {
		log.Printf("Warning: Database pool not initialized, skipping activity log")
		return nil
	}

	var metadataJSON []byte
	if metadata != nil {
		var err error
		metadataJSON, err = json.Marshal(metadata)
		if err != nil {
			log.Printf("Warning: Failed to marshal activity metadata: %v", err)
			metadataJSON = nil
		}
	}

	_, err := dbPool.Exec(ctx,
		`INSERT INTO public.activity_events 
		 (id, tenant_id, event_type, event_summary, event_detail, severity, metadata, created_at) 
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		uuid.New().String(),
		tenantID,
		string(eventType),
		summary,
		detail,
		string(severity),
		metadataJSON,
		time.Now(),
	)

	if err != nil {
		log.Printf("Failed to record activity event: %v", err)
		return err
	}

	return nil
}

// QueryActivityEvents retrieves activity events for a tenant
func QueryActivityEvents(ctx context.Context, tenantID string, limit int) ([]ActivityEvent, error) {
	if dbPool == nil {
		return nil, nil
	}

	if limit <= 0 {
		limit = 50 // Default limit
	}

	rows, err := dbPool.Query(ctx,
		`SELECT id, tenant_id, event_type, event_summary, event_detail, severity, metadata, created_at
		 FROM public.activity_events
		 WHERE tenant_id = $1
		 ORDER BY created_at DESC
		 LIMIT $2`,
		tenantID,
		limit,
	)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []ActivityEvent
	for rows.Next() {
		var event ActivityEvent
		var metadataJSON []byte

		err := rows.Scan(
			&event.ID,
			&event.TenantID,
			&event.EventType,
			&event.Summary,
			&event.Detail,
			&event.Severity,
			&metadataJSON,
			&event.Timestamp,
		)

		if err != nil {
			log.Printf("Failed to scan activity event: %v", err)
			continue
		}

		if len(metadataJSON) > 0 {
			if err := json.Unmarshal(metadataJSON, &event.Metadata); err != nil {
				log.Printf("Failed to unmarshal activity metadata: %v", err)
			}
		}

		events = append(events, event)
	}

	return events, nil
}

