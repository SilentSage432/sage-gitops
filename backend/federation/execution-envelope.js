// Execution Request Envelope - container for execution requests
// Carries an execution request through the system independent of whether it will be executed
// Separates request, identity, approval, mode, policy, and transport concerns
// This is the clean design pattern that most systems lack

export function createExecutionEnvelope(action, context = {}) {
  return {
    action,
    timestamp: Date.now(),
    operator: context.operator || null,
    approval: context.approval || null,
    mode: context.mode || "disabled",
    fingerprint: context.fingerprint || null,
    policy: context.policy || null,
    simulate: true, // no execution possible yet
    destination: context.destination || "local", // Phase 71: destination awareness
  };
}

