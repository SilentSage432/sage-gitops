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
    policy: context.policy || null,
    mode: context.mode || "disabled",
    destination: context.destination || "local", // Phase 71: destination awareness
    fingerprint: context.fingerprint || null,
    simulate: true, // no execution possible yet
    hardware: {
      // Phase 76: Bind Hardware Identity → Execution Identity
      // The envelope now carries the identity of the operator AND the cryptographic anchor of execution
      keyId: context.hardwareKeyId || null,
      verified: context.hardwareVerified || false,
    },
  };
}

