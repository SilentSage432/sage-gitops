// Phase 20: Action Plane Scaffolding
// Passive action type registry -- no execution allowed
// These represent the types of things SAGE will eventually be able to do
// Zero control, zero execution, just enumeration

export const ACTION_TYPES = [
  "QUERY",         // Read-only info requests
  "ECHO",          // Ping/heartbeat
  "DEPLOY",        // Deploy agents or manifests
  "CONFIG",        // Push configuration
  "ORCHESTRATE",   // Start/stop processes
  "POLICY",        // Update rules
  "FEDERATE",      // Add/remove nodes
] as const;

export type ActionType = (typeof ACTION_TYPES)[number];

// Phase 20: Validate action type (passive check only)
export function isValidActionType(type: string): type is ActionType {
  return ACTION_TYPES.includes(type as ActionType);
}

