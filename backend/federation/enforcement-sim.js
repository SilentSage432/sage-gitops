// Enforcement simulator — NO real actions are taken.

import { evaluateAction } from "./rule-engine.js";

export function simulateEnforcement(action, role = "sovereign") {
  const result = evaluateAction(action, role);

  // NOTE: this is ONLY reporting, no side effects.
  const allowed =
    result.eligibleAgents.length > 0 &&
    result.permitted === true;

  return {
    allowed,
    reason: result.reason,
    safety: result.safety,
    privilege: result.privilege,
    eligibleAgents: result.eligibleAgents.map(a => a.name),
    note: "Simulation only. No real enforce/deny.",
  };
}

