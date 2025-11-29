// The locked executor. Cannot execute anything yet.

export function executor(actionEnvelope) {
  const agents = actionEnvelope.targets || [];
  const payload = actionEnvelope.payload;
  const action = {
    id: actionEnvelope.actionId,
    type: actionEnvelope.type,
  };

  const simulatedDispatch = agents.map((agent) => {
    // Randomized synthetic failure model
    const failureRoll = Math.random();

    let status = "ok";

    if (failureRoll < 0.1) status = "failed";
    if (failureRoll >= 0.1 && failureRoll < 0.15) status = "unreachable";

    const retry = status !== "ok" ? {
      attempted: true,
      retryCount: status === "unreachable" ? 2 : 1,
      fallbackUsed: status === "unreachable",
    } : {
      attempted: false,
      retryCount: 0,
      fallbackUsed: false,
    };

    return {
      agent,
      action,
      payload,
      simulated: true,
      feedback: {
        received: status !== "unreachable",
        status,
        latencyMs: Math.floor(Math.random() * 40) + 5,
        note: "Simulated feedback only",
      },
      retry,
    };
  });

  return {
    ok: true,
    executed: false,
    dryRun: true,
    note: "Multi-agent dry-run simulation. Execution disabled.",
    envelope: actionEnvelope,
    dispatchPlan: simulatedDispatch,
    feedbackSummary: {
      total: agents.length,
      ok: simulatedDispatch.filter(d => d.feedback.status === "ok").length,
      failed: simulatedDispatch.filter(d => d.feedback.status === "failed").length,
      unreachable: simulatedDispatch.filter(d => d.feedback.status === "unreachable").length,
      retryAttempts: simulatedDispatch.filter(d => d.retry.attempted).length,
      fallbackUsed: simulatedDispatch.filter(d => d.retry.fallbackUsed).length,
    },
  };
}

