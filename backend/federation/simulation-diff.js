// Compare two simulation results and generate structured difference summary

export function diffSimulations(simA, simB) {
  return {
    agentsCompared: new Set([
      ...simA.dispatchPlan.map(d => d.agent),
      ...simB.dispatchPlan.map(d => d.agent),
    ]).size,

    convergenceChange:
      simA.convergence.converged === simB.convergence.converged
        ? "same"
        : simA.convergence.converged
        ? "scenario A converges, B does not"
        : "scenario B converges, A does not",

    failureDelta:
      simB.feedbackSummary.failed - simA.feedbackSummary.failed,

    unreachableDelta:
      simB.feedbackSummary.unreachable - simA.feedbackSummary.unreachable,

    retryDelta:
      simB.feedbackSummary.retryAttempts - simA.feedbackSummary.retryAttempts,

    fallbackDelta:
      simB.feedbackSummary.fallbackUsed - simA.feedbackSummary.fallbackUsed,
  };
}

