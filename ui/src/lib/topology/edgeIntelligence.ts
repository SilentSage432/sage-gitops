// 🧠 Edge Intelligence & Routing Logic
// Analyzes and enhances topology edges with health scoring, classification, and degradation propagation

import type { NormalizedTopology } from './normalizeTopology';

export type EdgeHealthStatus = 'healthy' | 'degraded' | 'broken' | 'unknown';
export type EdgeIntelligence = {
  id: string;
  healthStatus: EdgeHealthStatus;
  confidenceScore: number; // 0-1 scale, mapped to 1-4px thickness
  lastSeen?: string;
  failureCount?: number;
  degradationReason?: string;
  inferred?: boolean; // true if edge was inferred/fallback
};

export type EnhancedTopology = NormalizedTopology & {
  edgeIntelligence: Map<string, EdgeIntelligence>;
};

/**
 * Classify edges based on status and patterns
 */
export function classifyEdges(normalized: NormalizedTopology): Map<string, EdgeHealthStatus> {
  const classifications = new Map<string, EdgeHealthStatus>();

  normalized.edges.forEach(edge => {
    const status = (edge.status || '').toLowerCase();
    let health: EdgeHealthStatus = 'unknown';

    if (status === 'healthy') {
      health = 'healthy';
    } else if (status === 'degraded') {
      health = 'degraded';
    } else if (status === 'unreachable' || status === 'broken' || status === 'failed') {
      health = 'broken';
    } else if (status === 'unknown' || !status) {
      health = 'unknown';
    } else {
      // Default to degraded for ambiguous statuses
      health = 'degraded';
    }

    classifications.set(edge.id, health);
  });

  return classifications;
}

/**
 * Score edges based on multiple factors (confidence 0-1)
 */
export function scoreEdges(
  normalized: NormalizedTopology,
  classifications: Map<string, EdgeHealthStatus>
): Map<string, number> {
  const scores = new Map<string, number>();

  normalized.edges.forEach(edge => {
    let score = 0.5; // Base confidence

    const healthStatus = classifications.get(edge.id) || 'unknown';

    // Health status impact
    switch (healthStatus) {
      case 'healthy':
        score = 0.95;
        break;
      case 'degraded':
        score = 0.6;
        break;
      case 'broken':
        score = 0.2;
        break;
      case 'unknown':
        score = 0.4;
        break;
    }

    // Layer criticality boost
    if (edge.layer === 'control' || edge.layer === 'routing') {
      score += 0.1; // Higher confidence for critical layers
    }

    // Arc presence boost
    if (edge.arc) {
      score += 0.05; // More confidence if arc is defined
    }

    // Cap at 1.0
    score = Math.min(1.0, score);
    // Floor at 0.1
    score = Math.max(0.1, score);

    scores.set(edge.id, score);
  });

  return scores;
}

/**
 * Propagate degradation from broken edges to connected edges
 */
export function propagateDegradation(
  normalized: NormalizedTopology,
  classifications: Map<string, EdgeHealthStatus>,
  scores: Map<string, number>
): { classifications: Map<string, EdgeHealthStatus>, scores: Map<string, number> } {
  const newClassifications = new Map(classifications);
  const newScores = new Map(scores);

  // Find broken edges
  const brokenEdges = normalized.edges.filter(e => classifications.get(e.id) === 'broken');

  brokenEdges.forEach(brokenEdge => {
    // Find edges with same source or target
    const connectedEdges = normalized.edges.filter(e => 
      e.id !== brokenEdge.id && (
        e.source === brokenEdge.source ||
        e.target === brokenEdge.target ||
        e.source === brokenEdge.target ||
        e.target === brokenEdge.source
      )
    );

    connectedEdges.forEach(connected => {
      const currentHealth = newClassifications.get(connected.id);
      const currentScore = newScores.get(connected.id) || 0.5;

      // If edge is currently healthy, degrade it
      if (currentHealth === 'healthy') {
        newClassifications.set(connected.id, 'degraded');
        // Reduce confidence by 20%
        newScores.set(connected.id, Math.max(0.3, currentScore * 0.8));
      } else if (currentHealth === 'degraded') {
        // Further reduce confidence if already degraded
        newScores.set(connected.id, Math.max(0.2, currentScore * 0.9));
      }
    });
  });

  return { classifications: newClassifications, scores: newScores };
}

/**
 * Merge all edge intelligence into enhanced topology
 */
export function mergeEdgeIntelligence(normalized: NormalizedTopology): EnhancedTopology {
  // Step 1: Classify edges
  let classifications = classifyEdges(normalized);

  // Step 2: Score edges
  let scores = scoreEdges(normalized, classifications);

  // Step 3: Propagate degradation
  const { classifications: propagatedClassifications, scores: propagatedScores } = propagateDegradation(
    normalized,
    classifications,
    scores
  );

  classifications = propagatedClassifications;
  scores = propagatedScores;

  // Step 4: Build edge intelligence map
  const edgeIntelligence = new Map<string, EdgeIntelligence>();

  normalized.edges.forEach(edge => {
    const healthStatus = classifications.get(edge.id) || 'unknown';
    const confidenceScore = scores.get(edge.id) || 0.4;

    edgeIntelligence.set(edge.id, {
      id: edge.id,
      healthStatus,
      confidenceScore,
      lastSeen: new Date().toISOString(),
      inferred: false,
    });
  });

  return {
    ...normalized,
    edgeIntelligence,
  };
}

