package consent

// IntentApproval represents a pending, approved, or denied execution intent
// Status is not enforced. No policy logic. No action dispatch. Just stored state.
type IntentApproval struct {
	ID          string                 `json:"id"`
	RequestedBy string                 `json:"requested_by"`
	Timestamp   int64                  `json:"timestamp"`
	Action      string                 `json:"action"`
	Status      string                 `json:"status"` // pending | approved | denied
	Metadata    map[string]interface{} `json:"metadata"`
}

// In-memory store for intents (will be replaced with DB later)
var intentStore []IntentApproval

// GetPending returns all pending intent approvals
func GetPending() []IntentApproval {
	pending := []IntentApproval{}
	for _, intent := range intentStore {
		if intent.Status == "pending" {
			pending = append(pending, intent)
		}
	}
	return pending
}

// AddIntent adds a new intent to the store (for testing/simulation)
func AddIntent(intent IntentApproval) {
	intentStore = append(intentStore, intent)
}

