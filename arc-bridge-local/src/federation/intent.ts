// Phase 16: Federation Intent Engine (Passive Modeling Only)
// Passive intent registry for the federation.
// No execution, enforcement, or remote effects occur here.

export interface FederationIntent {
  target?: string;
  desired?: string;
  channel?: string;
  scope?: string;
  metadata?: Record<string, unknown>;
  created?: number;
  lifecycle?: string;
  staleAfter?: number; // Phase 16.5: Max age in milliseconds before intent is considered stale
  ts: number;
}

const intents: FederationIntent[] = [];

// declareIntent stores a desired future state for observation only.
// Phase 16.4: Default lifecycle to "pending"
// Phase 16.5: Default staleAfter to 60000ms (1 minute)
export function declareIntent(intent: Omit<FederationIntent, "ts" | "lifecycle">): void {
  intents.push({
    ...intent,
    lifecycle: "pending",
    staleAfter: intent.staleAfter || 60000, // 1 minute default
    ts: Date.now(),
  });
}

// listIntents exposes the passive intent list for read-only consumption.
export function listIntents(): FederationIntent[] {
  return intents.slice(-500); // retain recent intents; still in-memory only
}

// summarizeIntentLifecycle returns a histogram of intents by lifecycle stage.
export function summarizeIntentLifecycle(): Record<string, number> {
  return intents.reduce<Record<string, number>>((acc, intent) => {
    const key = intent.lifecycle || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

// Phase 16.5: Passive staleness detection
// Returns observations of which intents are stale based on age
// No actions taken - only classification
export interface StaleIntentObservation {
  intent: FederationIntent;
  stale: boolean;
  age: number; // Age in milliseconds
}

export function detectStaleIntents(): StaleIntentObservation[] {
  const now = Date.now();
  return intents.map((intent) => {
    const age = now - intent.ts;
    const staleAfter = intent.staleAfter || 60000; // Default 1 minute
    return {
      intent,
      stale: age > staleAfter,
      age,
    };
  });
}


