// Phase 16.2: Intent/State Divergence Detection (Read-Only)
// Passive intent/state divergence detector
// No reconciliation, no enforcement, no execution - only observation
import { listIntents, type FederationIntent } from "./intent.js";
import { listSubscriptions, type Subscription } from "./subscriptions.js";

export interface DivergenceObservation {
  intent: FederationIntent;
  status: "aligned" | "missing" | "diverged";
  match?: Subscription;
  ts: number;
}

// detectDivergence compares declared intents with actual state
// Returns read-only observations of where intent ≠ state
export function detectDivergence(): DivergenceObservation[] {
  const intents = listIntents();
  const subs = listSubscriptions();

  return intents.map((intent) => {
    // Phase 16.2: Simple matching logic - find subscription on same channel
    // More sophisticated matching can be added later (target matching, scope matching, etc.)
    const match = subs.find((s) => s.channel === intent.channel);

    let status: "aligned" | "missing" | "diverged" = "missing";
    if (match) {
      // If intent has a target, check if subscription ID matches
      if (intent.target && match.id === intent.target) {
        status = "aligned";
      } else if (intent.target && match.id !== intent.target) {
        status = "diverged"; // Intent targets different entity than subscription
      } else {
        status = "aligned"; // No specific target, channel match is sufficient
      }
    }

    return {
      intent,
      status,
      match: match || undefined,
      ts: Date.now(),
    };
  });
}

