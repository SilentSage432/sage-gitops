// Execution channel structure (disabled)

import { simulateEnforcement } from "./enforcement-sim.js";
import { buildDispatchEnvelope } from "./dispatch-envelope.js";
import { executor } from "./executor.js";

export function initiateExecutionChannel(action, role = "sovereign", scenario = "normal", options = {}) {
  const enforcement = simulateEnforcement(action, role);

  const requiresConsent =
    enforcement.privilege === "operator" ||
    enforcement.privilege === "sovereign";

  const envelope = buildDispatchEnvelope(
    action,
    enforcement.eligibleAgents
  );

  return {
    action,
    enforcement,
    allowed: enforcement.allowed,
    envelope,
    scenario,
    requiresConsent,
    executorReady: true,   // executor exists
    executor: (env) => executor(env, scenario),    // but still locked
    note:
      "Execution channel initialized. Execution disabled.",
  };
}

