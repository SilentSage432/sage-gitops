// Dry-run executor — no real execution.

export function dryExecute(envelope) {
  return {
    actionId: envelope.actionId,
    target: envelope.targets,
    type: envelope.type,
    ts: Date.now(),
    note: "Dry-run only. No real execution.",
    simulatedOutput: `Simulated execution of ${envelope.type}`,
  };
}

