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

// Phase 77: Hardware → Routing Validation Chain
// Validates hardware state for destination routing
// Still no blocking - this is architecture-level awareness
export function validateHardwareForDestination(envelope) {
  const dest = envelope.destination;
  
  // Local never requires hardware
  if (dest === "local") return true;
  
  // Prime is highest privilege — hardware awareness
  if (dest === "prime" && envelope.hardware?.verified) return true;
  
  // Operator destination always allowed for now
  if (dest === "operator") return true;
  
  // Federation may later require multi-sig
  if (dest === "federation") return true;
  
  return false;
}

// Phase 70: Route execution envelope through routing channel
// Phase 71: Routing channel begins respecting destination
// Phase 77: Hardware routing validation chain
// This introduces three major primitives: envelope, gate, routed state
// Still no routing logic yet - just carries destination data forward
export function routeEnvelope(action, context) {
  const envelope = createExecutionEnvelope(action, context);
  const gate = checkExecutionGate(action);
  
  // Phase 77: Validate hardware for destination
  const hardwareAllowed = validateHardwareForDestination(envelope);
  
  // We now have:
  // - allowed by gate?
  // - allowed by policy?
  // - allowed by mode?
  // - allowed by operator identity?
  // - allowed by destination?
  // - allowed by hardware?
  // But we are not yet requiring any of them.
  // This is the correct staging order.
  
  return {
    envelope,
    gate,
    routed: true,
    destination: envelope.destination, // Phase 71: destination from envelope
    hardwareAllowed, // Phase 77: hardware routing validation
    timestamp: Date.now(),
  };
}

