// The locked executor. Cannot execute anything yet.

export function executor(actionEnvelope) {
  return {
    ok: true,
    executed: false,
    dryRun: true,
    note: "Executor dry-run only. Execution disabled.",
    envelope: actionEnvelope,
    simulation: {
      targetAgents: actionEnvelope.targets,
      payload: actionEnvelope.payload,
      action: {
        id: actionEnvelope.actionId,
        type: actionEnvelope.type,
      },
    },
  };
}

