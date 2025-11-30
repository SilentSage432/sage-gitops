// Execution Gating Layer - formal enforcement pipeline
// Defines requirements for action eligibility and execution clearance state
// Execution is treated as a resource that must be unlocked
// Still simulated. Still no dispatch. Still no mutations.

import { currentOperator } from "../identity/operator-session.js";
import { getPolicyFor } from "./policy.js";
import { getApproval } from "./approval.js";
import { getExecutionMode } from "./execution-mode.js";
import { createExecutionEnvelope } from "./execution-envelope.js";
import { isValidDestination } from "./destinations.js";
import { isDestinationAllowed } from "./destination-policy.js";
import { enforcement } from "./execution-config.js";

export function checkExecutionGate(action) {
  if (!action || action === "none") {
    return {
      action: null,
      allowed: false,
      reasons: [
        "No action specified",
        "Execution mode disabled",
      ],
      clearance: "denied",
      timestamp: Date.now(),
    };
  }

  // Identity comes first - execution is only even theoretically allowed
  // when an operator identity is authenticated
  // Even before approval. Even before action. Even before decision.
  // MFA/YubiKey verification is also required - physical anchoring
  // Policy must also permit the action - federation rules
  const operator = currentOperator();
  const identitySatisfied = !!operator;
  const mfaSatisfied = operator?.mfa || false;
  
  // Get policy for this action
  const policy = getPolicyFor(action);
  
  // Check if operator meets policy requirements
  // For now, check if operator has a role that's allowed
  // Later this will be more sophisticated (tenant matching, agent checking, etc.)
  const operatorRole = operator?.role || "unknown";
  const meetsPolicy = identitySatisfied && policy.allowedRoles.includes(operatorRole);
  
  // Check for explicit operator approval
  const approved = getApproval(action);
  
  // Check execution mode
  const mode = getExecutionMode();
  const validMode = mode !== "disabled";
  
  // Deliberately lock the gate - sovereignty principle
  // We don't allow execution by accident or drift
  // All pre-execution requirements must be met explicitly
  // Identity is the first requirement, MFA is the second, Policy is the third, Approval is the fourth, Mode is the fifth
  // All five must be satisfied for execution to even be considered
  let allowed = identitySatisfied && mfaSatisfied && meetsPolicy && approved && validMode; // Still locked even with all, but all are prerequisites
  
  // Build reasons based on what's satisfied
  let reasons = [];
  if (!identitySatisfied) {
    reasons.push("no authenticated operator");
  } else if (!mfaSatisfied) {
    reasons.push("MFA not verified");
  } else if (!meetsPolicy) {
    reasons.push("policy does not allow this action");
  } else if (!approved) {
    reasons.push("operator has not approved action");
  } else if (!validMode) {
    reasons.push("execution disabled in current mode");
  } else {
    reasons.push("requirements satisfied", "sovereignty gate locked");
  }
  
  const gateState = {
    action,
    allowed: false, // ALWAYS false for now (execution mode disabled)
    mode,
    operator: operator || null,
    operatorApproval: approved,
    policy,
    reasons,
    requirements: {
      identity: {
        required: true,
        satisfied: identitySatisfied,
        reason: identitySatisfied ? "identity active" : "no authenticated operator",
      },
      mfa: {
        required: true,
        satisfied: mfaSatisfied,
        reason: mfaSatisfied ? "MFA/YubiKey verified" : (identitySatisfied ? "MFA not verified" : "identity required first"),
      },
      policy: {
        required: true,
        satisfied: meetsPolicy,
        reason: meetsPolicy ? "policy permits action" : (identitySatisfied ? `policy does not allow role: ${operatorRole}` : "identity required first"),
      },
      approval: {
        required: true,
        satisfied: approved,
        reason: approved ? "operator has approved action" : (identitySatisfied && mfaSatisfied && meetsPolicy ? "operator has not approved action" : "other requirements not met"),
      },
      mode: {
        required: true,
        satisfied: validMode,
        reason: validMode ? `execution mode: ${mode}` : "execution disabled in current mode",
      },
      riskBoundary: {
        required: true,
        satisfied: false,
        reason: "risk boundaries not validated",
      },
      policyMatch: {
        required: true,
        satisfied: false,
        reason: "policy match not verified",
      },
      authority: {
        required: true,
        satisfied: false,
        reason: "authority not established",
      },
    },
    clearance: "denied",
    note: "Execution gate deliberately locked. This is the sovereignty principle: execution must be explicitly permitted.",
    timestamp: Date.now(),
  };

  return gateState;
}

// Envelope-aware gate check - validates context + identity + binding + policy + mode inside an envelope
// Phase 72: Adds destination authorization to gate evaluation
// This separates professional sovereign platforms from normal systems
// Gate and envelope are separated:
// - Envelope carries the intent and context
// - Gate carries the policy and mode evaluation
// - Destination authorization checks if destination is allowed
export function checkEnvelopeAgainstGate(action, context) {
  const envelope = createExecutionEnvelope(action, context);
  const gate = checkExecutionGate(action);
  
  // Phase 72: Destination authorization
  const operator = currentOperator();
  const validDestination = isValidDestination(envelope.destination);
  const destinationAllowed = validDestination && isDestinationAllowed(envelope.destination, operator);
  
  // Combine gate evaluation with destination authorization
  // Destination must be valid AND allowed for the operator
  const destinationSatisfied = validDestination && destinationAllowed;
  
  // Phase 76: Hardware identity awareness
  // The gate now sees the hardware signature, but still does not require it
  const hardwareValid = envelope.hardware?.verified || false;
  
  // Phase 80: Hardware enforcement path introduced (but still disabled)
  // Add hardware-required rule (conditional only - does nothing until flag is flipped)
  let hardwareEnforcementReason = null;
  if (enforcement.requireHardware && !envelope.hardware?.verified) {
    hardwareEnforcementReason = "hardware key required";
  }
  
  // Add destination validation to reasons
  const allReasons = [...(gate.reasons || [])];
  if (!validDestination) {
    allReasons.push("destination not permitted");
  } else if (!destinationAllowed) {
    allReasons.push("destination not allowed for operator");
  }
  if (hardwareEnforcementReason) {
    allReasons.push(hardwareEnforcementReason);
  }
  
  // Final allowed state requires both gate approval AND destination authorization
  // Phase 80: Hardware enforcement is recognized but not required (flag is false)
  const allowed = gate.allowed && destinationSatisfied && !hardwareEnforcementReason;
  
  return {
    envelope,
    gate,
    allowed,
    operator,
    mode: gate.mode,
    destination: {
      value: envelope.destination,
      valid: validDestination,
      allowed: destinationAllowed,
      satisfied: destinationSatisfied,
    },
    hardware: envelope.hardware, // Phase 76: Hardware identity in gate result
    reason: allReasons.join(", ") || gate.clearance || "unknown",
    timestamp: Date.now(),
  };
}

