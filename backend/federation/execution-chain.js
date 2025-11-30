// Chain of Responsibility Simulation Layer - execution chain assembly
// Simulates the order of execution steps and responsibility mapping
// No execution. No dispatch. Just workflow planning.

import { buildExecutionCandidates } from "./execution-candidates.js";

export function buildExecutionChain(action) {
  if (!action || action === "none") {
    return {
      action: null,
      chain: [],
      timestamp: Date.now(),
    };
  }

  const candidates = buildExecutionCandidates(action);

  if (!candidates.candidates || candidates.candidates.length === 0) {
    return {
      action,
      chain: [],
      reason: "No eligible candidates",
      timestamp: Date.now(),
    };
  }

  // Build execution chain with sequence ordering
  const chain = candidates.candidates.map((cand, idx) => {
    const isPrimary = candidates.primaryCandidates?.some(c => c.agent === cand.agent) || false;
    const isFallback = candidates.fallbackCandidates?.some(c => c.agent === cand.agent) || false;
    const hasNext = idx < candidates.candidates.length - 1;
    const isLast = idx === candidates.candidates.length - 1;

    return {
      sequence: idx + 1,
      agent: cand.agent,
      role: cand.role,
      status: cand.status,
      capabilities: cand.capabilities,
      responsibility: isPrimary ? "primary" : isFallback ? "fallback" : "unknown",
      tier: cand.fallbackTier,
      confidence: cand.confidence,
      risk: cand.risk,
      fallback: hasNext,
      isPrimary,
      isFallback,
      isLast,
    };
  });

  return {
    action,
    chain,
    totalSteps: chain.length,
    primarySteps: chain.filter(s => s.isPrimary).length,
    fallbackSteps: chain.filter(s => s.isFallback).length,
    ordering: {
      primary: chain.filter(s => s.isPrimary).map(s => s.sequence),
      fallback: chain.filter(s => s.isFallback).map(s => s.sequence),
    },
    timestamp: Date.now(),
  };
}

