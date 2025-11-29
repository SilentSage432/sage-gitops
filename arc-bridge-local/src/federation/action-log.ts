// Phase 21: Passive Action Store + Audit Trail
// Records proposed actions without executing anything
// Still purely storage - no execution, no dispatch, no control
import type { ActionSchema } from "./action-schema.js";

const actionLog: ActionSchema[] = [];
const MAX_LOG_SIZE = 1000; // Keep last 1000 actions in memory

// recordAction stores an action in the audit trail
// No execution, no dispatch, no side effects - just logging
export function recordAction(action: ActionSchema): void {
  actionLog.push(action);

  // Prune old actions if log exceeds max size
  if (actionLog.length > MAX_LOG_SIZE) {
    actionLog.splice(0, actionLog.length - MAX_LOG_SIZE);
  }
}

// listActions returns all recorded actions (read-only)
export function listActions(): ActionSchema[] {
  return [...actionLog]; // Return copy to prevent external mutation
}

// getRecentActions returns the last N actions
export function getRecentActions(limit: number = 100): ActionSchema[] {
  const start = Math.max(0, actionLog.length - limit);
  return actionLog.slice(start);
}

