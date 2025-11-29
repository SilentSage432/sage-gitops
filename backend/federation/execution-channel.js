// Execution channel structure (disabled)

import { simulateEnforcement } from "./enforcement-sim.js";
import { buildDispatchEnvelope } from "./dispatch-envelope.js";
import { executor } from "./executor.js";

export function initiateExecutionChannel(action, role = "sovereign", options = {}) {
  const enforcement = simulateEnforcement(action, role);

  const requiresConsent =
    enforcement.privilege === "operator" ||
    enforcement.privilege === "sovereign";

  return {
    action,
    enforcement,
    allowed: enforcement.allowed,
    envelope: buildDispatchEnvelope(
      action,
      enforcement.eligibleAgents
    ),
    requiresConsent,
    executorReady: true,   // executor exists
    executor: executor,    // but still locked
    note:
      "Execution channel initialized. Execution disabled.",
  };
}

