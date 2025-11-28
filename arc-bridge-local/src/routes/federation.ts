import { Router } from "express";
import type { FederationNode } from "../types/shared.js";
import { enqueueCommand } from "../federation/commandQueue.js";

const router = Router();

// In-memory node registry (Phase 14.2/14.3)
const nodes: Map<string, { nodeId: string; ts: number; status: string; lastSeen: number }> = new Map();

// In-memory event stream (Phase 14.5)
const events: Array<{ ts: number; type: string; nodeId: string; data: Record<string, unknown> }> = [];
const MAX_EVENTS = 200;

// Phase 14.6: Route message through federation bus
function routeMessage(type: string, data: Record<string, unknown>, nodeId?: string): void {
  // Always record events first
  events.push({
    ts: Date.now(),
    type,
    nodeId: nodeId || (data.nodeId as string) || "unknown",
    data,
  });

  // Prune old events
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }

  // Route to appropriate handler
  switch (type) {
    case "heartbeat":
      if (data.nodeId) {
        const now = Date.now();
        nodes.set(data.nodeId as string, {
          nodeId: data.nodeId as string,
          ts: now,
          status: "online",
          lastSeen: now,
        });
      }
      return;

    case "telemetry":
      // Telemetry placeholder - safe no-op
      return;

    case "command":
      // Phase 15.2: Store command, NOT execute
      // Phase 15.5: Track routing channels (metadata & storage only)
      enqueueCommand({
        target: (data.target as string) || "",
        cmd: (data.cmd as string) || "",
        data: (data.data as Record<string, unknown>) || {},
        channel: (data.channel as string) || "node",
      });
      return;

    case "event":
      // Event already recorded above
      return;

    default:
      // Unknown types are recorded but not routed
      return;
  }
}

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

// Phase 13.11: Federation Bus endpoint
// Secure messaging endpoint for the federation backplane
router.post("/federation/bus", (req, res) => {
  try {
    const { type, data } = req.body;
    const nodeId = data?.nodeId || req.headers["x-federation-token"] || "unknown";

    // Phase 14.6: Route message (includes event recording and internal routing)
    routeMessage(type, data || {}, nodeId);

    // Return appropriate response based on message type
    if (type === "heartbeat") {
      res.json({
        ok: true,
        status: "alive",
      });
    } else if (type === "command") {
      res.json({
        ok: true,
        accepted: true,
        cmd: data?.cmd,
      });
    } else {
      res.json({
        ok: true,
        type,
      });
    }
  } catch (error) {
    console.error("Error in /federation/bus:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

