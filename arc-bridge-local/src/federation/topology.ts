// Phase 16.7: Federation Topology Mapping (Passive)
// Passive topology builder: nodes + edges
// Not controlling nodes, not sending messages, not linking networks - only representation
import { listSubscriptions } from "./subscriptions.js";
import { listIntents } from "./intent.js";

export interface TopologyNode {
  id: string;
  type?: string; // "intent-target" | "subscription" | "node"
}

export interface TopologyEdge {
  source: string;
  target?: string;
  channel: string;
  ts: number;
}

export interface FederationTopology {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

// federationTopology builds a graph representation of the federation
// Nodes: from intents (targets) and subscriptions (ids)
// Edges: from subscriptions (source, channel)
export function federationTopology(): FederationTopology {
  const intents = listIntents();
  const subs = listSubscriptions();

  // Collect unique node IDs from intents (targets) and subscriptions (ids)
  const nodeIds = new Set<string>();

  // Add nodes from intents (targets)
  intents.forEach((intent) => {
    if (intent.target) {
      nodeIds.add(intent.target);
    }
  });

  // Add nodes from subscriptions (ids)
  subs.forEach((sub) => {
    if (sub.id) {
      nodeIds.add(sub.id);
    }
  });

  // Build nodes array
  const nodes: TopologyNode[] = Array.from(nodeIds)
    .filter((id) => id && id.trim() !== "") // Filter out empty/null IDs
    .map((id) => ({
      id,
      type: "node", // Default type, can be enhanced later
    }));

  // Build edges from subscriptions
  const edges: TopologyEdge[] = subs
    .filter((sub) => sub.id && sub.id.trim() !== "") // Filter out empty subscriptions
    .map((sub) => ({
      source: sub.id,
      channel: sub.channel,
      ts: sub.ts,
    }));

  return {
    nodes,
    edges,
  };
}

