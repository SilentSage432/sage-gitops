// Execution Gating Layer - formal enforcement pipeline
// Defines requirements for action eligibility and execution clearance state
// Execution is treated as a resource that must be unlocked
// Still simulated. Still no dispatch. Still no mutations.

import { currentOperator } from "../identity/operator-session.js";

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
  const operator = currentOperator();
  const identitySatisfied = !!operator;
  
  // Deliberately lock the gate - sovereignty principle
  // We don't allow execution by accident or drift
  // All pre-execution requirements must be met explicitly
  // Identity is the first requirement
  let allowed = identitySatisfied; // Still locked even with identity, but identity is prerequisite
  
  const gateState = {
    action,
    allowed: false, // ALWAYS false for now (execution mode disabled)
    operator: operator || null,
    reasons: identitySatisfied
      ? ["identity active", "operator approval not granted", "execution mode disabled", "sovereignty gate locked"]
      : ["no authenticated operator"],
    requirements: {
      identity: {
        required: true,
        satisfied: identitySatisfied,
        reason: identitySatisfied ? "identity active" : "no authenticated operator",
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

