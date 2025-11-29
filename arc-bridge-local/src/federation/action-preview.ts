// Phase 22: Action Preview Sandbox (No Execution)
// Computes theoretical impact of an action WITHOUT executing it
// Think of this like kubectl diff, Terraform plan mode, Vault dry-run API
// We are building the predictive engine - safe lane FIRST

import type { ActionSchema } from "./action-schema.js";
import { federationTopology } from "./topology.js";
import { listSubscriptions } from "./subscriptions.js";
import { listIntents } from "./intent.js";

export interface ActionPreview {
  action: string;
  targets: Array<{
    id: string;
    type?: string;
  }>;
  affectedChannels?: string[];
  matchingSubscriptions?: number;
  matchingIntents?: number;
  timestamp: number;
  notes: string;
  impact: {
    nodes: number;
    channels: number;
    subscriptions: number;
    intents: number;
  };
}

// previewAction computes the theoretical impact of an action WITHOUT executing it
// This is purely predictive - no dispatch, no execution, no mutation
export function previewAction(action: ActionSchema): ActionPreview {
  const topo = federationTopology();
  const subscriptions = listSubscriptions();
  const intents = listIntents();

  // Phase 22: Analyze theoretical impact
  // If action has a target, filter to that specific node
  // Otherwise, consider all nodes as potential targets
  let potentialTargets = topo.nodes;
  if (action.target) {
    potentialTargets = topo.nodes.filter(node => node.id === action.target);
  }

  // Phase 22: Check channel affinity
  // If action specifies a channel, find matching subscriptions
  const matchingSubs = action.channel
    ? subscriptions.filter(sub => sub.channel === action.channel)
    : subscriptions;

  // Phase 22: Check intent alignment
  // Find intents that might be fulfilled by this action
  const matchingIntents = intents.filter(intent => {
    if (action.target && intent.target !== action.target) return false;
    if (action.channel && intent.channel !== action.channel) return false;
    return true;
  });

  // Phase 22: Determine affected channels
  const affectedChannels = action.channel
    ? [action.channel]
    : Array.from(new Set(subscriptions.map(sub => sub.channel)));

  return {
    action: action.type,
    targets: potentialTargets,
    affectedChannels: affectedChannels,
    matchingSubscriptions: matchingSubs.length,
    matchingIntents: matchingIntents.length,
    timestamp: Date.now(),
    notes: "Simulation only. No dispatch, no execution, no federation alteration.",
    impact: {
      nodes: potentialTargets.length,
      channels: affectedChannels.length,
      subscriptions: matchingSubs.length,
      intents: matchingIntents.length,
    },
  };
}

