// The locked executor. Cannot execute anything yet.

export function executor(actionEnvelope) {
  const agents = actionEnvelope.targets || [];
  const payload = actionEnvelope.payload;
  const action = {
    id: actionEnvelope.actionId,
    type: actionEnvelope.type,
  };

  const simulatedDispatch = agents.map((agent) => ({
    agent,
    action,
    payload,
    simulated: true,
  }));

  return {
    ok: true,
    executed: false,
    dryRun: true,
    note: "Multi-agent dry-run simulation. Execution disabled.",
    envelope: actionEnvelope,
    dispatchPlan: simulatedDispatch,
  };
}

