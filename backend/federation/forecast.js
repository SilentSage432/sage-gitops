// Outcome forecast modeling - prediction engine for future state
// Simulates what the system would look like after action execution
// No execution. No mutation. Just prediction.

export function forecastOutcome(action, candidateSet) {
  if (!action || !candidateSet || !candidateSet.candidates || candidateSet.candidates.length === 0) {
    return {
      action: action || "unknown",
      candidates: [],
      prediction: {
        expectedState: "unknown",
        availability: "unknown",
        fallbackReady: false,
        recoveryPlan: "unknown",
      },
      confidence: "low",
      timestamp: Date.now(),
    };
  }

  const candidates = candidateSet.candidates;
  const primaryCandidates = candidateSet.primaryCandidates || [];
  const fallbackCandidates = candidateSet.fallbackCandidates || [];
  const onlineCandidates = candidates.filter(c => c.status === "online");
  const primaryOnline = primaryCandidates.filter(c => c.status === "online");

  // Calculate average confidence from online candidates
  const avgConfidence = onlineCandidates.length > 0
    ? onlineCandidates.reduce((sum, c) => sum + (c.confidence || 0), 0) / onlineCandidates.length
    : 0;

  // Determine expected state based on candidate availability and risk
  let expectedState = "healthy";
  if (onlineCandidates.length === 0) {
    expectedState = "degraded";
  } else if (primaryOnline.length === 0 && fallbackCandidates.length === 0) {
    expectedState = "degraded";
  } else if (candidates.some(c => c.risk > 0.3 && c.status === "online")) {
    expectedState = "at-risk";
  } else if (primaryOnline.length < primaryCandidates.length && fallbackCandidates.length === 0) {
    expectedState = "degraded";
  }

  // Determine availability forecast
  let availability = "high";
  if (primaryOnline.length === 0) {
    if (fallbackCandidates.length > 0 && fallbackCandidates.some(c => c.status === "online")) {
      availability = "moderate";
    } else {
      availability = "low";
    }
  } else if (primaryOnline.length < primaryCandidates.length) {
    availability = "moderate";
  } else if (candidates.some(c => c.risk > 0.2)) {
    availability = "moderate";
  }

  // Determine fallback readiness
  const fallbackReady = fallbackCandidates.some(c => c.status === "online" && c.confidence > 0.5);

  // Determine recovery plan requirement
  let recoveryPlan = "none required";
  if (onlineCandidates.length === 0) {
    recoveryPlan = "agent recovery required";
  } else if (primaryOnline.length === 0) {
    recoveryPlan = "primary agent recovery or fallback activation";
  } else if (candidates.some(c => c.risk > 0.3)) {
    recoveryPlan = "monitoring and potential intervention";
  } else if (!fallbackReady && fallbackCandidates.length > 0) {
    recoveryPlan = "fallback agent provisioning";
  }

  // Determine confidence level
  let confidence = "moderate";
  if (avgConfidence >= 0.9 && primaryOnline.length === primaryCandidates.length && candidates.every(c => c.risk < 0.1)) {
    confidence = "high";
  } else if (avgConfidence < 0.6 || onlineCandidates.length < candidates.length * 0.5) {
    confidence = "low";
  }

  return {
    action,
    candidates: candidates.map(c => ({
      agent: c.agent,
      role: c.role,
      status: c.status,
      confidence: c.confidence,
      risk: c.risk,
    })),
    prediction: {
      expectedState,
      availability,
      fallbackReady,
      recoveryPlan,
    },
    metrics: {
      totalCandidates: candidates.length,
      onlineCount: onlineCandidates.length,
      primaryOnline: primaryOnline.length,
      primaryTotal: primaryCandidates.length,
      fallbackReady: fallbackCandidates.filter(c => c.status === "online" && c.confidence > 0.5).length,
      averageConfidence: Math.round(avgConfidence * 100) / 100,
    },
    confidence,
    timestamp: Date.now(),
  };
}

