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
    feedback: {
      received: true,
      status: "ok",
      latencyMs: Math.floor(Math.random() * 40) + 5,
      note: "Simulated feedback only",
    },
  }));

  return {
    ok: true,
    executed: false,
    dryRun: true,
    note: "Multi-agent dry-run simulation. Execution disabled.",
    envelope: actionEnvelope,
    dispatchPlan: simulatedDispatch,
    feedbackSummary: {
      total: agents.length,
      ok: agents.length,
      failed: 0,
      unreachable: 0,
    },
  };
}

