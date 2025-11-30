// Pre-flight risk scoring layer - simulation only
// Calculates risk profile, system impact, and expected reliability
// No execution. No mutation. Just awareness.

export function calculateRiskScore(candidateSet) {
  if (!candidateSet || !candidateSet.candidates || candidateSet.candidates.length === 0) {
    return {
      action: candidateSet?.action || "unknown",
      risk: {
        systemImpact: "unknown",
        failureLikelihood: "high",
        availabilityImpact: "high",
      },
      confidence: 0,
      timestamp: Date.now(),
    };
  }

  const candidates = candidateSet.candidates;
  const totalCandidates = candidates.length;
  const onlineCandidates = candidates.filter(c => c.status === "online").length;
  const primaryCandidates = candidateSet.primaryCandidates || [];
  const fallbackCandidates = candidateSet.fallbackCandidates || [];

  // Calculate average confidence and risk from candidates
  const avgConfidence = candidates.reduce((sum, c) => sum + (c.confidence || 0), 0) / totalCandidates;
  const avgRisk = candidates.reduce((sum, c) => sum + (c.risk || 0), 0) / totalCandidates;
  const maxRisk = Math.max(...candidates.map(c => c.risk || 0));

  // Determine system impact based on safety level and agent roles
  const safetyLevel = candidates[0]?.safetyLevel || "unknown";
  let systemImpact = "low";
  if (safetyLevel === "high") systemImpact = "high";
  else if (safetyLevel === "elevated") systemImpact = "moderate";
  else if (safetyLevel === "moderate") systemImpact = "low";
  else if (safetyLevel === "safe") systemImpact = "minimal";

  // Determine failure likelihood based on candidate availability and risk
  let failureLikelihood = "low";
  if (onlineCandidates === 0) {
    failureLikelihood = "high";
  } else if (onlineCandidates < totalCandidates * 0.5) {
    failureLikelihood = "moderate";
  } else if (avgRisk > 0.15 || maxRisk > 0.3) {
    failureLikelihood = "moderate";
  } else if (avgRisk > 0.3) {
    failureLikelihood = "high";
  }

  // Determine availability impact based on primary candidate availability
  let availabilityImpact = "low";
  if (primaryCandidates.length === 0) {
    availabilityImpact = "high";
  } else {
    const primaryOnline = primaryCandidates.filter(c => c.status === "online").length;
    if (primaryOnline === 0) {
      availabilityImpact = "moderate";
      if (fallbackCandidates.length === 0) {
        availabilityImpact = "high";
      }
    } else if (primaryOnline < primaryCandidates.length) {
      availabilityImpact = "low";
    }
  }

  return {
    action: candidateSet.action,
    risk: {
      systemImpact,
      failureLikelihood,
      availabilityImpact,
    },
    metrics: {
      totalCandidates,
      onlineCandidates,
      primaryCount: primaryCandidates.length,
      fallbackCount: fallbackCandidates.length,
      averageConfidence: Math.round(avgConfidence * 100) / 100,
      averageRisk: Math.round(avgRisk * 100) / 100,
      maxRisk: Math.round(maxRisk * 100) / 100,
    },
    safetyLevel,
    timestamp: Date.now(),
  };
}

