package main

import (
	"encoding/json"
	"net/http"

	"github.com/silentsage432/sage-gitops/onboarding/backend/internal/consent"
)

// GetPendingIntent returns all pending intent approvals
// The API returns data. Still no action.
func GetPendingIntent(w http.ResponseWriter, r *http.Request) {
	approveList := consent.GetPending()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(approveList)
}

