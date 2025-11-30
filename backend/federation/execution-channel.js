// Execution channel structure (disabled)
// Phase 70: Execution Envelope Routing Channel
// A routing substrate for intention - not messaging, not execution, the layer in between

import { simulateEnforcement } from "./enforcement-sim.js";
import { buildDispatchEnvelope } from "./dispatch-envelope.js";
import { executor } from "./executor.js";
import { combineScenarios } from "./scenarios.js";
import { createExecutionEnvelope } from "./execution-envelope.js";
import { checkExecutionGate } from "./execution-gate.js";

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

// Phase 70: Route execution envelope through routing channel
// Phase 71: Routing channel begins respecting destination
// This introduces three major primitives: envelope, gate, routed state
// Still no routing logic yet - just carries destination data forward
export function routeEnvelope(action, context) {
  const envelope = createExecutionEnvelope(action, context);
  const gate = checkExecutionGate(action);
  
  return {
    envelope,
    gate,
    routed: true,
    destination: envelope.destination, // Phase 71: destination from envelope
    timestamp: Date.now(),
  };
}

