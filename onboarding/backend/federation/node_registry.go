package federation

import (
	"sync"
	"time"
)

// Phase 14.2: In-memory node registry
// Phase 14.3: Extended with offline detection and status calculation
// Later phases will move to real persistence if needed

// OFFLINE_THRESHOLD is the timeout in milliseconds for considering a node offline
// Default: 45 seconds (configurable for SAGE Prime tuning)
const OFFLINE_THRESHOLD = 45 * 1000 // 45 seconds in milliseconds

// NodeStatus represents a node's current status
type NodeStatus struct {
	NodeID   string `json:"nodeId"`
	TS       int64  `json:"ts"`
	Status   string `json:"status"`   // "online" or "offline"
	LastSeen int64  `json:"lastSeen"` // Timestamp of last heartbeat
}

var (
	nodes     = make(map[string]*NodeStatus)
	nodesMutex sync.RWMutex
)

// UpdateNodeHeartbeat updates the heartbeat timestamp for a node
func UpdateNodeHeartbeat(nodeID string) {
	nodesMutex.Lock()
	defer nodesMutex.Unlock()
	
	now := time.Now().UnixMilli()
	nodes[nodeID] = &NodeStatus{
		NodeID:   nodeID,
		TS:       now,
		Status:   "online",
		LastSeen: now,
	}
}

// GetNodes returns all registered nodes with calculated status
// Phase 14.3: Automatically calculates online/offline status based on timeout
func GetNodes() []*NodeStatus {
	nodesMutex.RLock()
	defer nodesMutex.RUnlock()
	
	now := time.Now().UnixMilli()
	result := make([]*NodeStatus, 0, len(nodes))
	
	for _, node := range nodes {
		// Calculate if node is offline based on threshold
		offline := (now - node.TS) > OFFLINE_THRESHOLD
		
		status := "online"
		if offline {
			status = "offline"
		}
		
		result = append(result, &NodeStatus{
			NodeID:   node.NodeID,
			TS:       node.TS,
			Status:   status,
			LastSeen: node.TS,
		})
	}
	return result
}

// GetNode returns a specific node's status
func GetNode(nodeID string) *NodeStatus {
	nodesMutex.RLock()
	defer nodesMutex.RUnlock()
	return nodes[nodeID]
}

