// 🧬 GodView API Client
// Handles API calls for topology and node data

export type NodeInfo = {
  name: string;
  roles: string[];
  internalIP: string;
  architecture?: string;
  osImage?: string;
  kubeletVersion?: string;
  taints?: any[];
  status?: string;
};

export type TopologyResponse = {
  meshId: string;
  clusterId: string;
  updatedAt: string;
  nodeCount?: number;
  nodes?: NodeInfo[];
};

export type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  items?: T[];
  error?: string;
};

// Mappings topology types
export type RouteInfo = {
  id: string;
  intent: string;
  description: string;
  target: string;
  cluster: string;
  arc: string;
  status: 'healthy' | 'degraded' | 'unreachable';
};

export type ArcInfo = {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'unreachable';
  routes: RouteInfo[];
};

export type ClusterInfo = {
  id: string;
  name: string;
  location: string;
  arcs: ArcInfo[];
};

export type MappingsResponse = {
  meshId: string;
  clusters: ClusterInfo[];
  updatedAt: string;
};

/**
 * Get topology data from /api/godview/topology
 */
export async function getTopology(): Promise<ApiResponse<TopologyResponse>> {
  try {
    const res = await fetch('/api/godview/topology', {
      credentials: 'omit',
    });

    if (!res.ok) {
      return {
        ok: false,
        error: `HTTP ${res.status}`,
      };
    }

    const data: TopologyResponse = await res.json();

    // Validate required fields
    if (!data.meshId || !data.clusterId) {
      return {
        ok: false,
        error: 'Invalid topology response format',
      };
    }

    return {
      ok: true,
      data,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Failed to fetch topology',
    };
  }
}

/**
 * Get nodes data from /api/godview/nodes
 * Falls back to extracting from topology if endpoint doesn't exist
 */
export async function getNodes(): Promise<ApiResponse<NodeInfo[]>> {
  try {
    const res = await fetch('/api/godview/nodes', {
      credentials: 'omit',
    });

    if (!res.ok) {
      // If endpoint doesn't exist (404), try to get nodes from topology
      if (res.status === 404) {
        const topologyRes = await getTopology();
        if (topologyRes.ok && topologyRes.data?.nodes) {
          return {
            ok: true,
            items: topologyRes.data.nodes,
          };
        }
      }

      return {
        ok: false,
        error: `HTTP ${res.status}`,
      };
    }

    const items: NodeInfo[] = await res.json();

    if (!Array.isArray(items)) {
      return {
        ok: false,
        error: 'Invalid nodes response format',
      };
    }

    return {
      ok: true,
      items,
    };
  } catch (err: any) {
    // Fallback to topology
    try {
      const topologyRes = await getTopology();
      if (topologyRes.ok && topologyRes.data?.nodes) {
        return {
          ok: true,
          items: topologyRes.data.nodes,
        };
      }
    } catch {
      // Ignore fallback errors
    }

    return {
      ok: false,
      error: err?.message || 'Failed to fetch nodes',
    };
  }
}

/**
 * Enhanced RouteInfo with new fields from GV-2.1
 */
export type EnhancedRouteInfo = RouteInfo & {
  source?: string;
  targetService?: string;
  layer?: 'control' | 'telemetry' | 'encryption' | 'ui' | 'routing';
  criticality?: 'core' | 'supporting' | 'experimental';
};

/**
 * Sanitize and validate route/mapping data
 */
function sanitizeRoute(route: any): EnhancedRouteInfo | null {
  if (!route || typeof route !== 'object') return null;

  // Required fields with fallbacks
  const id = String(route.id || route.intent || `route-${Date.now()}-${Math.random()}`);
  const intent = String(route.intent || 'unknown.intent');
  const description = String(route.description || '');
  const target = String(route.target || route.targetService || 'unknown');
  const cluster = String(route.cluster || 'unknown-cluster');
  const arc = String(route.arc || 'unknown-arc');
  
  // Status with validation
  let status: 'healthy' | 'degraded' | 'unreachable' = 'healthy';
  const statusStr = String(route.status || 'healthy').toLowerCase();
  if (statusStr === 'degraded' || statusStr === 'warning') {
    status = 'degraded';
  } else if (statusStr === 'unreachable' || statusStr === 'broken' || statusStr === 'failed' || statusStr === 'offline') {
    status = 'unreachable';
  }

  const sanitized: EnhancedRouteInfo = {
    id,
    intent,
    description,
    target,
    cluster,
    arc,
    status,
  };

  // Optional fields
  if (route.source) sanitized.source = String(route.source);
  if (route.targetService) sanitized.targetService = String(route.targetService);
  if (route.layer) sanitized.layer = String(route.layer) as any;
  if (route.criticality) sanitized.criticality = String(route.criticality) as any;

  return sanitized;
}

/**
 * Generate fallback inferred edges when lifecycle is offline
 */
function generateFallbackEdges(): EnhancedRouteInfo[] {
  return [
    {
      id: 'inferred-ui-backend',
      intent: 'ui.backend',
      description: 'Inferred UI → API connection (lifecycle offline)',
      target: 'sage-api',
      cluster: 'sage-talos-alpha',
      arc: 'arc-omega',
      status: 'degraded',
      source: 'sage-enterprise-ui',
      layer: 'ui',
      criticality: 'core',
    },
    {
      id: 'inferred-whisperer-command',
      intent: 'whisperer.command',
      description: 'Inferred Whisperer → Orchestrator (lifecycle offline)',
      target: 'mesh-orchestrator',
      cluster: 'sage-talos-alpha',
      arc: 'arc-chi',
      status: 'degraded',
      source: 'whisperer-terminal',
      layer: 'control',
      criticality: 'core',
    },
    {
      id: 'inferred-telemetry-ingest',
      intent: 'telemetry.ingest',
      description: 'Inferred telemetry collection (lifecycle offline)',
      target: 'telemetry-collector',
      cluster: 'sage-talos-alpha',
      arc: 'arc-chi',
      status: 'degraded',
      source: 'agents',
      layer: 'telemetry',
      criticality: 'supporting',
    },
  ];
}

/**
 * Get mappings topology data from /api/godview/mappings
 * Returns a flat array of routes (GV-2.1 format)
 * Includes sanitization and fallback edges when lifecycle is offline
 */
export async function getMappings(includeFallback: boolean = false): Promise<ApiResponse<EnhancedRouteInfo[]>> {
  try {
    const res = await fetch('/api/godview/mappings', {
      credentials: 'omit',
    });

    if (!res.ok) {
      // If offline and fallback requested, return inferred edges
      if (includeFallback && (res.status === 502 || res.status === 503 || res.status === 504)) {
        const fallbackEdges = generateFallbackEdges();
        return {
          ok: true,
          items: fallbackEdges,
        };
      }

      return {
        ok: false,
        error: `HTTP ${res.status}`,
      };
    }

    let data: any = await res.json();

    // Validate response is an array
    if (!Array.isArray(data)) {
      // Try to extract from nested structure if needed
      if (data && Array.isArray(data.routes)) {
        data = data.routes;
      } else if (data && Array.isArray(data.clusters)) {
        // Flatten cluster structure
        const routes: EnhancedRouteInfo[] = [];
        data.clusters.forEach((cluster: any) => {
          if (cluster.arcs && Array.isArray(cluster.arcs)) {
            cluster.arcs.forEach((arc: any) => {
              if (arc.routes && Array.isArray(arc.routes)) {
                routes.push(...arc.routes);
              }
            });
          }
        });
        data = routes;
      } else {
        return {
          ok: false,
          error: 'Invalid mappings response format - expected array',
        };
      }
    }

    // Sanitize all routes
    const sanitized: EnhancedRouteInfo[] = [];
    data.forEach((route: any) => {
      const clean = sanitizeRoute(route);
      if (clean) {
        sanitized.push(clean);
      }
    });

    // If no routes and fallback requested, add fallback edges
    if (sanitized.length === 0 && includeFallback) {
      const fallbackEdges = generateFallbackEdges();
      return {
        ok: true,
        items: fallbackEdges,
      };
    }

    return {
      ok: true,
      items: sanitized,
    };
  } catch (err: any) {
    // If fallback requested and network error, return inferred edges
    if (includeFallback) {
      const errorMsg = (err?.message || '').toLowerCase();
      if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('timeout')) {
        const fallbackEdges = generateFallbackEdges();
        return {
          ok: true,
          items: fallbackEdges,
        };
      }
    }

    return {
      ok: false,
      error: err?.message || 'Failed to fetch mappings',
    };
  }
}

