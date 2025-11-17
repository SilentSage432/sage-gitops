// 🧬 GodView State Store
// Manages topology state for real-time updates

import type { TopologyResponse, NodeInfo, EnhancedRouteInfo } from '../api/godviewClient';
import { normalizeTopology, type NormalizedTopology } from '../lib/topology/normalizeTopology';
import { mergeEdgeIntelligence, type EnhancedTopology } from '../lib/topology/edgeIntelligence';

export type FederationHealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNKNOWN';
export type TopologyStateStatus = 'LIVE' | 'DEGRADED' | 'BROKEN' | 'OFFLINE';

interface GodViewState {
  normalized: NormalizedTopology | null;
  enhanced: EnhancedTopology | null;
  topology: TopologyResponse | null;
  nodes: NodeInfo[] | null;
  mappings: EnhancedRouteInfo[] | null;
  status: TopologyStateStatus;
  lastUpdated: string;
  activeArcs: string[]; // Empty array means "All" is active
  selectedNodeId?: string;
  selectedRouteId?: string;
  selectedEdgeId?: string; // For insight panel
}

let state: GodViewState = {
  normalized: null,
  enhanced: null,
  topology: null,
  nodes: null,
  mappings: null,
  status: 'OFFLINE',
  lastUpdated: '',
  activeArcs: [], // Empty array = "All" active
  selectedNodeId: undefined,
  selectedRouteId: undefined,
  selectedEdgeId: undefined,
};

const listeners = new Set<() => void>();

export function getTopology(): TopologyResponse | null {
  return state.topology;
}

export function getNodes(): NodeInfo[] {
  return state.normalized?.nodes || state.nodes || state.topology?.nodes || [];
}

export function getNormalizedTopology(): NormalizedTopology | null {
  return state.normalized;
}

export function getEnhancedTopology(): EnhancedTopology | null {
  return state.enhanced;
}

export function getTopologyStatus(): TopologyStateStatus {
  return state.status;
}

export function getLastUpdated(): string {
  return state.lastUpdated;
}

export function getActiveArcs(): string[] {
  return state.activeArcs;
}

export function isAllArcsActive(): boolean {
  return state.activeArcs.length === 0;
}

export function getSelectedNodeId(): string | undefined {
  return state.selectedNodeId;
}

export function getSelectedRouteId(): string | undefined {
  return state.selectedRouteId;
}

/**
 * Toggle arc in active filters
 * If arc is already active, removes it; otherwise adds it
 * If "All" is being toggled, clears all specific arcs
 */
export function toggleArc(arc: string) {
  if (arc === 'ALL') {
    // Toggle "All" - clears all specific arcs
    state.activeArcs = [];
  } else {
    // Toggle specific arc
    const index = state.activeArcs.indexOf(arc);
    if (index >= 0) {
      // Remove arc
      state.activeArcs = state.activeArcs.filter(a => a !== arc);
    } else {
      // Add arc (removes "All" behavior)
      state.activeArcs = [...state.activeArcs, arc];
    }
  }
  // Clear node/route selection when arc changes
  state.selectedNodeId = undefined;
  state.selectedRouteId = undefined;
  listeners.forEach(listener => listener());
}

/**
 * Reset filters to "All" (clear all specific arcs)
 */
export function resetArcsToAll() {
  state.activeArcs = [];
  state.selectedNodeId = undefined;
  state.selectedRouteId = undefined;
  listeners.forEach(listener => listener());
}

/**
 * Select a route by ID
 */
export function selectRoute(routeId: string | null) {
  state.selectedRouteId = routeId || undefined;
  // Clear node selection when route is selected
  if (routeId) {
    state.selectedNodeId = undefined;
  }
  listeners.forEach(listener => listener());
}

/**
 * Clear selected route
 */
export function clearSelectedRoute() {
  state.selectedRouteId = undefined;
  listeners.forEach(listener => listener());
}

/**
 * Get selected route object from enhanced topology
 */
export function getSelectedRoute() {
  const enhanced = state.enhanced;
  const routeId = state.selectedRouteId;
  if (!enhanced || !routeId) return null;
  
  return enhanced.edges.find(edge => edge.id === routeId) || null;
}

/**
 * Get selected edge ID (for insight panel)
 */
export function getSelectedEdgeId(): string | undefined {
  return state.selectedEdgeId;
}

/**
 * Set selected edge ID (opens insight panel)
 */
export function setSelectedEdgeId(edgeId: string | undefined) {
  state.selectedEdgeId = edgeId;
  // Clear node selection when edge is selected
  if (edgeId) {
    state.selectedNodeId = undefined;
  }
  listeners.forEach(listener => listener());
}

/**
 * Get selected edge object from enhanced topology
 */
export function getSelectedEdge() {
  const enhanced = state.enhanced;
  const edgeId = state.selectedEdgeId;
  if (!enhanced || !edgeId) return null;
  
  return enhanced.edges.find(edge => edge.id === edgeId) || null;
}

/**
 * Clear selected edge (closes insight panel)
 */
export function clearSelectedEdge() {
  state.selectedEdgeId = undefined;
  listeners.forEach(listener => listener());
}

/**
 * Set selected node ID
 */
export function setSelectedNodeId(nodeId: string | undefined) {
  state.selectedNodeId = nodeId;
  // Clear route selection when node is selected
  if (nodeId) {
    state.selectedRouteId = undefined;
  }
  listeners.forEach(listener => listener());
}


/**
 * Clear all selections
 */
export function clearSelection() {
  state.selectedNodeId = undefined;
  state.selectedRouteId = undefined;
  listeners.forEach(listener => listener());
}

/**
 * Get filtered edges based on active arcs
 * If activeArcs is empty (All), returns all edges
 * Otherwise returns edges matching any active arc
 */
export function getFilteredEdges() {
  const enhanced = state.enhanced;
  if (!enhanced || !enhanced.edges) return [];
  
  if (state.activeArcs.length === 0) {
    // "All" is active
    return enhanced.edges;
  }
  
  // Filter edges matching any active arc
  return enhanced.edges.filter(edge => 
    edge.arc && state.activeArcs.includes(edge.arc)
  );
}

/**
 * Get filtered nodes based on active arcs (nodes connected to filtered edges)
 */
export function getFilteredNodes() {
  const enhanced = state.enhanced;
  if (!enhanced || !enhanced.edges || !enhanced.nodes) return [];
  
  if (state.activeArcs.length === 0) {
    // "All" is active
    return enhanced.nodes;
  }
  
  // Get nodes that are source or target of edges in active arcs
  const filteredEdges = getFilteredEdges();
  const nodeNames = new Set<string>();
  
  filteredEdges.forEach(edge => {
    if (edge.source) nodeNames.add(edge.source);
    if (edge.target) nodeNames.add(edge.target);
  });
  
  return enhanced.nodes.filter(node => nodeNames.has(node.name));
}

/**
 * Fetch and update topology from all sources
 * Normalizes data before saving state
 */
export async function fetchAndNormalizeTopology() {
  try {
    const { getTopology: fetchTopology, getNodes: fetchNodes, getMappings: fetchMappings } = await import('../api/godviewClient');
    
    const [topologyRes, nodesRes, mappingsRes] = await Promise.allSettled([
      fetchTopology(),
      fetchNodes(),
      fetchMappings(),
    ]);

    // Extract successful results
    const topology = topologyRes.status === 'fulfilled' && topologyRes.value.ok ? topologyRes.value.data : null;
    const nodes = nodesRes.status === 'fulfilled' && nodesRes.value.ok ? nodesRes.value.items : null;
    const mappings = mappingsRes.status === 'fulfilled' && mappingsRes.value.ok ? mappingsRes.value.items : null;

    // Normalize the combined data
    const normalized = normalizeTopology({
      topology,
      nodes,
      mappings: mappings || [],
    });

    // Apply edge intelligence
    const enhanced = mergeEdgeIntelligence(normalized);

    // Determine state status based on edge health patterns
    let status: TopologyStateStatus = 'LIVE';
    
    if (!topology && !nodes && !mappings) {
      status = 'OFFLINE';
    } else if (normalized.status === 'stale' || (!topology && !nodes && !mappings)) {
      status = 'OFFLINE';
    } else {
      // Analyze edge health patterns
      const edgeIntelligence = enhanced.edgeIntelligence;
      const edgeCount = edgeIntelligence.size;
      
      if (edgeCount === 0) {
        status = 'OFFLINE';
      } else {
        let brokenCount = 0;
        let degradedCount = 0;
        let healthyCount = 0;

        edgeIntelligence.forEach((intel) => {
          switch (intel.healthStatus) {
            case 'broken':
              brokenCount++;
              break;
            case 'degraded':
              degradedCount++;
              break;
            case 'healthy':
              healthyCount++;
              break;
          }
        });

        // Determine status based on edge health
        const brokenRatio = brokenCount / edgeCount;
        const degradedRatio = degradedCount / edgeCount;

        if (brokenRatio > 0.5) {
          // More than 50% broken = BROKEN
          status = 'BROKEN';
        } else if (brokenRatio > 0.2 || degradedRatio > 0.5) {
          // >20% broken OR >50% degraded = DEGRADED
          status = 'DEGRADED';
        } else if (degradedRatio > 0.2 || normalized.status === 'partial' || !topology || !mappings || !nodes) {
          // >20% degraded OR partial data = DEGRADED
          status = 'DEGRADED';
        } else {
          // Mostly healthy = LIVE
          status = 'LIVE';
        }
      }
    }

    // Update state (preserve selection state)
    state = {
      ...state,
      normalized,
      enhanced,
      topology,
      nodes,
      mappings: mappings || [],
      status,
      lastUpdated: new Date().toISOString(),
    };

    // Notify all listeners
    listeners.forEach(listener => listener());
  } catch (err: any) {
    console.error('[godviewStore] Error fetching topology:', err);
    
    // Provide fallback normalized object even on error
    const fallbackNormalized: NormalizedTopology = {
      nodes: [],
      edges: [],
      arcs: [],
      status: 'stale',
    };

    const fallbackEnhanced = mergeEdgeIntelligence(fallbackNormalized);

    state = {
      ...state,
      normalized: fallbackNormalized,
      enhanced: fallbackEnhanced,
      status: 'OFFLINE',
      lastUpdated: new Date().toISOString(),
      // Preserve selection state on error
    };

    listeners.forEach(listener => listener());
  }
}

export function setTopology(newTopology: TopologyResponse) {
  state.topology = newTopology;
  
  // Re-normalize with current state
  const normalized = normalizeTopology({
    topology: newTopology,
    nodes: state.nodes,
    mappings: state.mappings || [],
  });

  // Apply edge intelligence
  const enhanced = mergeEdgeIntelligence(normalized);

  // Update status based on edge health patterns
  let status: TopologyStateStatus = state.status;
  
  const edgeIntelligence = enhanced.edgeIntelligence;
  const edgeCount = edgeIntelligence.size;

  if (edgeCount === 0 || normalized.status === 'stale') {
    status = 'OFFLINE';
  } else {
    let brokenCount = 0;
    let degradedCount = 0;

    edgeIntelligence.forEach((intel) => {
      if (intel.healthStatus === 'broken') brokenCount++;
      else if (intel.healthStatus === 'degraded') degradedCount++;
    });

    const brokenRatio = brokenCount / edgeCount;
    const degradedRatio = degradedCount / edgeCount;

    if (brokenRatio > 0.5) {
      status = 'BROKEN';
    } else if (brokenRatio > 0.2 || degradedRatio > 0.5 || normalized.status === 'partial') {
      status = 'DEGRADED';
    } else if (normalized.status === 'ok' && state.mappings && state.nodes) {
      status = 'LIVE';
    }
  }

  state.normalized = normalized;
  state.enhanced = enhanced;
  state.status = status;
  state.lastUpdated = new Date().toISOString();
  
  // Notify all listeners
  listeners.forEach(listener => listener());
}

export function getFederationSummary() {
  const nodes = getNodes();
  const nodeCount = nodes.length;
  const normalized = state.normalized;
  const hasAnyData = !!state.topology || nodeCount > 0 || (normalized && (normalized.edges.length > 0 || normalized.arcs.length > 0));

  let status: FederationHealthStatus = 'UNKNOWN';

  if (!hasAnyData) {
    status = 'UNKNOWN';
  } else if (nodes.length === 0) {
    status = 'UNKNOWN';
  } else if (nodes.every(n => (n.status || '').toLowerCase() === 'healthy')) {
    status = 'HEALTHY';
  } else {
    status = 'DEGRADED';
  }

  return {
    meshId: state.topology?.meshId ?? 'unknown-mesh',
    clusterId: state.topology?.clusterId ?? 'unknown-cluster',
    nodeCount,
    status,
    lastUpdated: state.lastUpdated || null,
  };
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

