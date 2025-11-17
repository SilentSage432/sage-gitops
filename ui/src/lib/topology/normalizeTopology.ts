// 🧬 Topology Normalization
// Normalizes nodes, topology, and mappings into a consistent shape

import type { NodeInfo, TopologyResponse, EnhancedRouteInfo } from '../../api/godviewClient';

export type NormalizedTopology = {
  nodes: NodeInfo[];
  edges: Array<{
    id: string;
    source: string;
    target: string;
    intent: string;
    arc?: string;
    layer?: string;
    status?: string;
  }>;
  arcs: string[];
  status: 'ok' | 'partial' | 'stale';
};

type TopologyInput = {
  nodes?: NodeInfo[] | null;
  topology?: TopologyResponse | null;
  mappings?: EnhancedRouteInfo[] | null;
};

/**
 * Normalize topology data from multiple sources into a consistent shape
 * Strips null/undefined values, deduplicates edges, fills defaults
 */
export function normalizeTopology(input: TopologyInput): NormalizedTopology {
  // Extract nodes from topology or direct input
  const nodes: NodeInfo[] = [];
  
  if (input.topology?.nodes) {
    nodes.push(...input.topology.nodes.filter(Boolean));
  }
  if (input.nodes) {
    // Merge nodes, deduplicate by name
    const nodeMap = new Map<string, NodeInfo>();
    nodes.forEach(n => {
      if (n.name) nodeMap.set(n.name, n);
    });
    input.nodes.forEach(n => {
      if (n && n.name) {
        // Prefer node from direct input if it exists
        if (!nodeMap.has(n.name) || !nodeMap.get(n.name)?.status) {
          nodeMap.set(n.name, n);
        }
      }
    });
    // Replace with deduplicated nodes
    nodes.length = 0;
    nodes.push(...Array.from(nodeMap.values()));
  }

  // Extract edges from mappings (routes)
  const edgeMap = new Map<string, NormalizedTopology['edges'][0]>();
  
  if (input.mappings && Array.isArray(input.mappings)) {
    input.mappings.forEach((route) => {
      if (!route || !route.id || !route.intent) return;
      
      // Create edge from route
      const edgeId = route.id;
      if (!edgeMap.has(edgeId)) {
        edgeMap.set(edgeId, {
          id: edgeId,
          source: route.source || route.intent.split('.')[0] || 'unknown',
          target: route.target || route.targetService || 'unknown',
          intent: route.intent,
          arc: route.arc || undefined,
          layer: route.layer || undefined,
          status: route.status || undefined,
        });
      }
    });
  }

  // Extract unique arcs from mappings
  const arcSet = new Set<string>();
  if (input.mappings && Array.isArray(input.mappings)) {
    input.mappings.forEach((route) => {
      if (route?.arc) {
        arcSet.add(route.arc);
      }
    });
  }
  const arcs = Array.from(arcSet).sort();

  // Determine status
  let status: NormalizedTopology['status'] = 'ok';
  
  // If we have no nodes and no mappings, it's stale
  if (nodes.length === 0 && edgeMap.size === 0) {
    status = 'stale';
  }
  // If we have some data but not all expected sources, it's partial
  else if (
    (!input.topology || !input.mappings || !input.nodes) &&
    (nodes.length > 0 || edgeMap.size > 0)
  ) {
    status = 'partial';
  }

  return {
    nodes: nodes.map(node => {
      // Strip null/undefined values
      const clean: NodeInfo = {
        name: node.name || '',
        roles: Array.isArray(node.roles) ? node.roles.filter(Boolean) : [],
        internalIP: node.internalIP || '',
      };
      
      // Add optional fields only if they exist
      if (node.architecture) clean.architecture = node.architecture;
      if (node.osImage) clean.osImage = node.osImage;
      if (node.kubeletVersion) clean.kubeletVersion = node.kubeletVersion;
      if (node.status) clean.status = node.status;
      if (node.taints) clean.taints = node.taints;
      
      return clean;
    }),
    edges: Array.from(edgeMap.values()),
    arcs,
    status,
  };
}

