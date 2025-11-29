// Command routing engine — NO dispatch or execution.

import { getEligibleAgents } from "./capability-matcher.js";

export function routeAction(action) {
  const eligible = getEligibleAgents(action.type);

  return {
    action,
    actionId: action.id,
    type: action.type,
    potentialTargets: eligible.map(a => a.name),
    reason: eligible.length
      ? "Matched by capability model"
      : "No capability match found",
    notes: "Routing only. No dispatch or execution.",
  };
}

