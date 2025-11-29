// The locked executor. Cannot execute anything yet.

export function executor(actionEnvelope) {
  return {
    ok: false,
    executed: false,
    note: "Executor skeleton only. Real execution is locked.",
    envelope: actionEnvelope,
  };
}

