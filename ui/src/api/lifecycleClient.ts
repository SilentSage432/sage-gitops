// 🔧 Lifecycle API Client
// Handles API calls for pods, deployments, and namespaces

export type K8sPod = {
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
  };
  status: {
    phase: string;
    containerStatuses?: Array<{
      ready: boolean;
      restartCount?: number;
    }>;
    hostIP?: string;
    podIP?: string;
  };
};

export type K8sDeployment = {
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp?: string;
  };
  spec: {
    replicas?: number;
  };
  status: {
    replicas?: number;
    readyReplicas?: number;
    availableReplicas?: number;
  };
};

export type LifecycleResponse<T = any> = {
  namespace: string;
  items: T[];
  updatedAt: string;
};

export type LifecycleStatus = 'loading' | 'unreachable' | 'ready';

export type ApiResponse<T> = {
  ok: boolean;
  data?: LifecycleResponse<T>;
  items?: T[];
  error?: string;
  status?: LifecycleStatus;
  reason?: string;
};

/**
 * Detect if error indicates unreachable K8s API
 */
function isUnreachableError(err: any): boolean {
  if (!err) return false;
  
  const msg = (err.message || '').toLowerCase();
  const errorType = err.name || '';
  
  // Network errors
  if (errorType === 'TypeError' && msg.includes('fetch')) return true;
  if (msg.includes('network') || msg.includes('failed to fetch')) return true;
  if (msg.includes('timeout') || msg.includes('timed out')) return true;
  if (msg.includes('connection') || msg.includes('connect')) return true;
  if (msg.includes('econnrefused') || msg.includes('etimedout')) return true;
  
  return false;
}

/**
 * Get pods from /api/lifecycle/pods?ns=<namespace>
 */
export async function getPods(ns: string = 'all'): Promise<ApiResponse<K8sPod>> {
  try {
    const res = await fetch(`/api/lifecycle/pods?ns=${encodeURIComponent(ns)}`, {
      credentials: 'omit',
    });

    if (!res.ok) {
      // HTTP errors that suggest unreachable API
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        return {
          ok: false,
          status: 'unreachable',
          error: 'K8s API unreachable',
          reason: 'Lifecycle API gateway error - K8s API may be unreachable from arc-ui',
        };
      }
      
      return {
        ok: false,
        status: 'unreachable',
        error: `HTTP ${res.status}`,
        reason: 'Lifecycle API returned error status',
      };
    }

    const data: LifecycleResponse<K8sPod> = await res.json();

    // Validate response structure
    if (!data.namespace || !Array.isArray(data.items)) {
      return {
        ok: false,
        status: 'unreachable',
        error: 'Invalid pods response format',
        reason: 'Lifecycle API returned invalid response structure',
      };
    }

    return {
      ok: true,
      status: 'ready',
      data,
      items: data.items,
    };
  } catch (err: any) {
    // Map network/connection errors to unreachable status
    if (isUnreachableError(err)) {
      return {
        ok: false,
        status: 'unreachable',
        error: 'K8s API unreachable',
        reason: 'Deep lifecycle introspection is gated by Talos network isolation on the core SAGE node. The UI and API wiring are ready; full pod/deployment visibility will unlock once a dedicated telemetry cluster (e.g. Pi cluster) is allowed to introspect the federation.',
      };
    }
    
    return {
      ok: false,
      status: 'unreachable',
      error: err?.message || 'Failed to fetch pods',
      reason: 'Unable to reach lifecycle API endpoint',
    };
  }
}

/**
 * Get deployments from /api/lifecycle/deploys?ns=<namespace>
 */
export async function getDeployments(ns: string = 'all'): Promise<ApiResponse<K8sDeployment>> {
  try {
    const res = await fetch(`/api/lifecycle/deploys?ns=${encodeURIComponent(ns)}`, {
      credentials: 'omit',
    });

    if (!res.ok) {
      // HTTP errors that suggest unreachable API
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        return {
          ok: false,
          status: 'unreachable',
          error: 'K8s API unreachable',
          reason: 'Lifecycle API gateway error - K8s API may be unreachable from arc-ui',
        };
      }
      
      return {
        ok: false,
        status: 'unreachable',
        error: `HTTP ${res.status}`,
        reason: 'Lifecycle API returned error status',
      };
    }

    const data: LifecycleResponse<K8sDeployment> = await res.json();

    // Validate response structure
    if (!data.namespace || !Array.isArray(data.items)) {
      return {
        ok: false,
        status: 'unreachable',
        error: 'Invalid deployments response format',
        reason: 'Lifecycle API returned invalid response structure',
      };
    }

    return {
      ok: true,
      status: 'ready',
      data,
      items: data.items,
    };
  } catch (err: any) {
    // Map network/connection errors to unreachable status
    if (isUnreachableError(err)) {
      return {
        ok: false,
        status: 'unreachable',
        error: 'K8s API unreachable',
        reason: 'Deep lifecycle introspection is gated by Talos network isolation on the core SAGE node. The UI and API wiring are ready; full pod/deployment visibility will unlock once a dedicated telemetry cluster (e.g. Pi cluster) is allowed to introspect the federation.',
      };
    }
    
    return {
      ok: false,
      status: 'unreachable',
      error: err?.message || 'Failed to fetch deployments',
      reason: 'Unable to reach lifecycle API endpoint',
    };
  }
}

/**
 * Get namespaces from /api/lifecycle/namespaces
 * Falls back to empty array if endpoint doesn't exist
 */
export async function getNamespaces(): Promise<ApiResponse<string>> {
  try {
    const res = await fetch('/api/lifecycle/namespaces', {
      credentials: 'omit',
    });

    if (!res.ok) {
      // If endpoint doesn't exist, return empty array
      if (res.status === 404) {
        return {
          ok: true,
          items: [],
        };
      }

      return {
        ok: false,
        error: `HTTP ${res.status}`,
      };
    }

    const data = await res.json();

    // Handle both array and object responses
    let items: string[] = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (data.items && Array.isArray(data.items)) {
      items = data.items;
    } else if (data.namespaces && Array.isArray(data.namespaces)) {
      items = data.namespaces;
    }

    return {
      ok: true,
      items,
    };
  } catch (err: any) {
    // Return empty array on error (non-blocking)
    return {
      ok: true,
      items: [],
    };
  }
}

