// Phase 16.9: Federation Reasoning Model (Passive)
// Passive reasoning engine: derives explanations/flags only
// No actions, no commands, no reconciliation - just reasoning
import { federationTopology, type FederationTopology } from "./topology.js";
import { listIntents, type FederationIntent } from "./intent.js";
import { listSubscriptions } from "./subscriptions.js";

export interface FederationReason {
  type: string;
  detail: string;
  severity?: "info" | "warning" | "error";
  context?: Record<string, unknown>;
}

// deriveReasons analyzes federation state and generates explanations
// Returns read-only reasons - no actions taken
export function deriveReasons(): FederationReason[] {
  const topo = federationTopology();
  const intents = listIntents();
  const subscriptions = listSubscriptions();

  const reasons: FederationReason[] = [];

  // Phase 16.9: Missing nodes for intents
  // If an intent targets a node that doesn't exist in topology, flag it
  for (const intent of intents) {
    if (intent.target) {
      const nodeExists = topo.nodes.some((node) => node.id === intent.target);
      if (!nodeExists) {
        reasons.push({
          type: "missing-node",
          detail: `Intent targets "${intent.target}" but node not present in topology.`,
          severity: "warning",
          context: {
            intentTarget: intent.target,
            intentChannel: intent.channel,
            intentDesired: intent.desired,
          },
        });
      }
    }
  }

  // Phase 16.9: Orphaned nodes (no edges/subscriptions)
  // If a node exists in topology but has no subscriptions, it's orphaned
  for (const node of topo.nodes) {
    const hasEdges = topo.edges.some((edge) => edge.source === node.id);
    if (!hasEdges) {
      reasons.push({
        type: "orphan",
        detail: `Node "${node.id}" has no subscriptions or edges.`,
        severity: "info",
        context: {
          nodeId: node.id,
          nodeType: node.type,
        },
      });
    }
  }

  // Phase 16.9: Redundant edges (edge has no matching intent)
  // If an edge exists but no intent targets that channel, it might be redundant
  for (const edge of topo.edges) {
    const hasMatchingIntent = intents.some(
      (intent) => intent.channel === edge.channel && intent.target === edge.source
    );
    if (!hasMatchingIntent) {
      // Only flag if this seems like it should have an intent (not all edges need intents)
      // This is informational, not necessarily a problem
      reasons.push({
        type: "redundant-edge",
        detail: `Edge from "${edge.source}" on channel "${edge.channel}" has no matching intent.`,
        severity: "info",
        context: {
          source: edge.source,
          channel: edge.channel,
        },
      });
    }
  }

  // Phase 16.9: Intent without subscription
  // If an intent targets a channel but no subscription exists for that channel
  for (const intent of intents) {
    if (intent.channel && intent.target) {
      const hasSubscription = subscriptions.some(
        (sub) => sub.channel === intent.channel && sub.id === intent.target
      );
      if (!hasSubscription) {
        reasons.push({
          type: "intent-without-subscription",
          detail: `Intent targets channel "${intent.channel}" for "${intent.target}" but no subscription exists.`,
          severity: "warning",
          context: {
            intentTarget: intent.target,
            intentChannel: intent.channel,
            intentDesired: intent.desired,
          },
        });
      }
    }
  }

  return reasons;
}

