import { Router } from "express";
import type { FederationNode } from "../types/shared.js";

const router = Router();

// In-memory node registry (Phase 14.2/14.3)
const nodes: Map<string, { nodeId: string; ts: number; status: string; lastSeen: number }> = new Map();

// In-memory event stream (Phase 14.5)
const events: Array<{ ts: number; type: string; nodeId: string; data: Record<string, unknown> }> = [];
const MAX_EVENTS = 200;

router.get("/federation/nodes", (_req, res) => {
  const nodeList: FederationNode[] = [
    { id: "prime-001", status: "online", role: "prime" },
    { id: "pi-worker-01", status: "offline", role: "worker" },
    { id: "pi-worker-02", status: "offline", role: "worker" }
  ];
  res.json(nodeList);
});

// Phase 14.3: Federation Nodes Status endpoint
// Returns empty array if no nodes registered yet (UI not federated)
router.get("/federation/nodes/status", (_req, res) => {
  try {
    const now = Date.now();
    const OFFLINE_THRESHOLD = 45 * 1000; // 45 seconds
    
    const nodeStatuses = Array.from(nodes.values()).map((node) => {
      const offline = (now - node.ts) > OFFLINE_THRESHOLD;
      return {
        nodeId: node.nodeId,
        ts: node.ts,
        status: offline ? "offline" : "online",
        lastSeen: node.ts,
      };
    });
    
    // Return empty array if no nodes registered (UI not federated yet)
    res.json({
      ts: now,
      nodes: nodeStatuses || [],
    });
  } catch (error) {
    console.error("Error in /federation/nodes/status:", error);
    // Return empty response instead of error if UI not federated
    res.json({
      ts: Date.now(),
      nodes: [],
    });
  }
});

// Phase 14.5: Federation Events endpoint
// Returns empty array if no events recorded yet (UI not federated)
router.get("/federation/events", (_req, res) => {
  try {
    const recentEvents = events.slice(-MAX_EVENTS);
    res.json({
      events: recentEvents || [],
    });
  } catch (error) {
    console.error("Error in /federation/events:", error);
    // Return empty response instead of error if UI not federated
    res.json({
      events: [],
    });
  }
});

export default router;

