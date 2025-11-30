// Execution Gating Layer - formal enforcement pipeline
// Defines requirements for action eligibility and execution clearance state
// Execution is treated as a resource that must be unlocked
// Still simulated. Still no dispatch. Still no mutations.

import { currentOperator } from "../identity/operator-session.js";
import { getPolicyFor } from "./policy.js";

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
  
  // Deliberately lock the gate - sovereignty principle
  // We don't allow execution by accident or drift
  // All pre-execution requirements must be met explicitly
  // Identity is the first requirement, MFA is the second, Policy is the third
  // All three must be satisfied for execution to even be considered
  let allowed = identitySatisfied && mfaSatisfied && meetsPolicy; // Still locked even with all, but all are prerequisites
  
  // Build reasons based on what's satisfied
  let reasons = [];
  if (!identitySatisfied) {
    reasons.push("no authenticated operator");
  } else if (!mfaSatisfied) {
    reasons.push("MFA not verified");
  } else if (!meetsPolicy) {
    reasons.push("policy does not allow this action");
  } else {
    reasons.push("requirements satisfied", "operator approval not granted", "execution mode disabled", "sovereignty gate locked");
  }
  
  const gateState = {
    action,
    allowed: false, // ALWAYS false for now (execution mode disabled)
    operator: operator || null,
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
        satisfied: false,
        reason: "operator approval not granted",
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

