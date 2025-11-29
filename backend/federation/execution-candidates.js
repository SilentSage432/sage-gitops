// Execution candidate pipeline - read-only classification only
// Returns which agents would be eligible and in what order
// No execution. No dispatch. Just intelligence.

import { getEligibleAgents } from "./capability-matcher.js";
import { getSafetyLevel } from "./action-safety.js";
import { getRoleSimulationProfile } from "./agent-registry.js";

export function buildExecutionCandidates(actionType) {
  if (!actionType || actionType === "none") {
    return {
      action: null,
      candidates: [],
      reason: "No action specified",
      timestamp: Date.now(),
    };
  }

  // Get eligible agents
  const eligible = getEligibleAgents(actionType);
  const safety = getSafetyLevel(actionType);

  // Build candidate pipeline with scoring
  const candidates = eligible.map((agent) => {
    const roleProfile = getRoleSimulationProfile(agent.role);
    
    // Confidence score: higher for online agents, lower for offline
    // Core agents get higher confidence than edge/observer
    let confidence = 0.5;
    
    if (agent.status === "online") {
      confidence = 0.9;
      if (agent.role === "core") confidence = 0.95;
      if (agent.role === "edge") confidence = 0.85;
      if (agent.role === "observer") confidence = 0.80;
    } else {
      confidence = 0.1; // Offline agents have low confidence
    }

    // Risk adjustment based on safety level and agent role
    let risk = roleProfile.failureChance;
    if (safety === "high") risk += 0.2;
    if (safety === "elevated") risk += 0.1;
    if (safety === "moderate") risk += 0.05;

    // Fallback tier: core agents are primary, edge secondary, observer tertiary
    let fallbackTier = 1;
    if (agent.role === "core") fallbackTier = 1;
    else if (agent.role === "edge") fallbackTier = 2;
    else if (agent.role === "observer") fallbackTier = 3;

    return {
      agent: agent.name,
      role: agent.role,
      status: agent.status,
      confidence,
      risk,
      fallbackTier,
      safetyLevel: safety,
      capabilities: agent.capabilities,
    };
  });

  // Sort candidates:
  // 1. Online status first
  // 2. Lower fallback tier (primary before secondary)
  // 3. Higher confidence
  // 4. Lower risk
  candidates.sort((a, b) => {
    // Status priority: online > offline
    if (a.status !== b.status) {
      return a.status === "online" ? -1 : 1;
    }
    // Fallback tier: lower is better
    if (a.fallbackTier !== b.fallbackTier) {
      return a.fallbackTier - b.fallbackTier;
    }
    // Higher confidence first
    if (Math.abs(a.confidence - b.confidence) > 0.01) {
      return b.confidence - a.confidence;
    }
    // Lower risk first
    return a.risk - b.risk;
  });

  return {
    action: actionType,
    candidates,
    safetyLevel: safety,
    totalEligible: candidates.length,
    primaryCandidates: candidates.filter(c => c.fallbackTier === 1),
    fallbackCandidates: candidates.filter(c => c.fallbackTier > 1),
    reason: "simulation-only",
    timestamp: Date.now(),
  };
}

