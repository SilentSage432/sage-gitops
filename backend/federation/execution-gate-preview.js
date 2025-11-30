// Execution Gate Preview - mode-aware gate preview for "what would happen"
// Allows SAGE to predict the outcome of execution without performing it
// Still no execution. Just prediction and reporting.

import { checkExecutionGate } from "./execution-gate.js";
import { createExecutionEnvelope } from "./execution-envelope.js";

export function previewExecutionGate(action, context = {}) {
  if (!action || action === "none") {
    const envelope = createExecutionEnvelope(null, context);
    return {
      action: null,
      preview: true,
      status: "blocked under current state",
      gate: null,
      envelope,
      timestamp: Date.now(),
    };
  }

  // Create the execution envelope (container for the request)
  const envelope = createExecutionEnvelope(action, context);

  // Check the gate (doesn't change state, just reports)
  const gate = checkExecutionGate(action);

  // Determine preview status based on gate state
  let status;
  if (!gate.allowed) {
    // Check why it's not allowed
    if (!gate.operator) {
      status = "blocked: no authenticated operator";
    } else if (!gate.operator.mfa) {
      status = "blocked: MFA not verified";
    } else if (!gate.requirements?.policy?.satisfied) {
      status = "blocked: policy does not allow action";
    } else if (!gate.operatorApproval) {
      status = "blocked: operator approval not granted";
    } else if (gate.mode === "disabled") {
      status = "would be allowed if mode permitted";
    } else {
      status = "blocked under current state";
    }
  } else {
    status = "would be allowed if mode permitted";
  }

  return {
    envelope,
    gate,
    preview: true,
    status,
    wouldAllow: gate.requirements?.identity?.satisfied &&
                 gate.requirements?.mfa?.satisfied &&
                 gate.requirements?.policy?.satisfied &&
                 gate.requirements?.approval?.satisfied &&
                 gate.mode !== "disabled",
    note: "Preview only. No state changes. No execution.",
    timestamp: Date.now(),
  };
}

