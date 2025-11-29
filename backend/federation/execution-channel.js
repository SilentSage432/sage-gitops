// Execution channel structure (disabled)

import { simulateEnforcement } from "./enforcement-sim.js";
import { buildDispatchEnvelope } from "./dispatch-envelope.js";
import { executor } from "./executor.js";
import { combineScenarios } from "./scenarios.js";

export function initiateExecutionChannel(action, role = "sovereign", scenario = ["normal"], options = {}) {
  const enforcement = simulateEnforcement(action, role);

  const requiresConsent =
    enforcement.privilege === "operator" ||
    enforcement.privilege === "sovereign";

  const envelope = buildDispatchEnvelope(
    action,
    enforcement.eligibleAgents
  );

  // Ensure scenario is an array
  const scenarioArray = Array.isArray(scenario) ? scenario : [scenario];
  const combinedScenario = combineScenarios(scenarioArray);

  return {
    action,
    enforcement,
    allowed: enforcement.allowed,
    envelope,
    scenario: scenarioArray,
    combinedScenario,
    requiresConsent,
    executorReady: true,   // executor exists
    executor: (env) => executor(env, combinedScenario),    // but still locked
    note:
      "Execution channel initialized. Execution disabled.",
  };
}

