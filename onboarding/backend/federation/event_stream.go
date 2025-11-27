package federation

import (
	"sync"
	"time"
)

// Phase 14.5: Federation Event Stream
// In-memory event stream for federation awareness
// Safe, internal, isolated - no filesystem, no spawning, no network, no commands

// FederationEvent represents a single federation event
type FederationEvent struct {
	TS     int64                  `json:"ts"`
	Type   string                 `json:"type"`
	NodeID string                 `json:"nodeId"`
	Data   map[string]interface{} `json:"data"`
}

var (
	events     []*FederationEvent
	eventsMutex sync.RWMutex
	maxEvents  = 200 // Keep last 200 events in memory
)

// AddEvent adds a new event to the stream
func AddEvent(eventType string, nodeID string, data map[string]interface{}) {
	eventsMutex.Lock()
	defer eventsMutex.Unlock()
	
	event := &FederationEvent{
		TS:     time.Now().UnixMilli(),
		Type:   eventType,
		NodeID: nodeID,
		Data:   data,
	}
	
	events = append(events, event)
	
	// Prune old events if we exceed maxEvents
	if len(events) > maxEvents {
		events = events[len(events)-maxEvents:]
	}
}

// GetEvents returns the last N events (tail of stream)
func GetEvents() []*FederationEvent {
	eventsMutex.RLock()
	defer eventsMutex.RUnlock()
	
	// Return last 200 events (in-memory tail)
	start := 0
	if len(events) > maxEvents {
		start = len(events) - maxEvents
	}
	
	result := make([]*FederationEvent, len(events)-start)
	copy(result, events[start:])
	return result
}

