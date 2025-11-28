package federation

// Phase 14.6: Federation Routing Rules & Bus API
// Central router module for clean classification and routing of federation messages
// Internal routing only - no execution, just classification

// RouteMessage routes a federation message to the appropriate handler
// This is NOT execution—just classification and internal routing
func RouteMessage(eventType string, nodeID string, data map[string]interface{}) {
	// Always record events first
	AddEvent(eventType, nodeID, data)

	// Route to appropriate handler based on type
	switch eventType {
	case "heartbeat":
		// Route to node registry
		UpdateNodeHeartbeat(nodeID)
		return

	case "telemetry":
		// Telemetry placeholder - safe no-op
		// Future: route to telemetry store
		return

	case "command":
		// Command is not executed, just acknowledged
		// Future: route to command router
		return

	case "event":
		// Event is already recorded in stream
		// Future: additional event processing
		return

	default:
		// Unknown types are recorded but not routed
		return
	}
}

