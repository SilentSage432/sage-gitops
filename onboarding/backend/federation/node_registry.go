package federation

import (
	"sync"
	"time"
)

// Phase 14.2: In-memory node registry
// Later phases will move to real persistence if needed

// NodeStatus represents a node's current status
type NodeStatus struct {
	NodeID string    `json:"nodeId"`
	TS     int64     `json:"ts"`
	Status string    `json:"status"`
}

var (
	nodes     = make(map[string]*NodeStatus)
	nodesMutex sync.RWMutex
)

// UpdateNodeHeartbeat updates the heartbeat timestamp for a node
func UpdateNodeHeartbeat(nodeID string) {
	nodesMutex.Lock()
	defer nodesMutex.Unlock()
	
	nodes[nodeID] = &NodeStatus{
		NodeID: nodeID,
		TS:     time.Now().UnixMilli(),
		Status: "online",
	}
}

// GetNodes returns all registered nodes
func GetNodes() []*NodeStatus {
	nodesMutex.RLock()
	defer nodesMutex.RUnlock()
	
	result := make([]*NodeStatus, 0, len(nodes))
	for _, node := range nodes {
		result = append(result, node)
	}
	return result
}

// GetNode returns a specific node's status
func GetNode(nodeID string) *NodeStatus {
	nodesMutex.RLock()
	defer nodesMutex.RUnlock()
	return nodes[nodeID]
}

