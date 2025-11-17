// Raw Kubernetes object types
export type K8sPod = {
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp: string;
    labels?: Record<string, string>;
    ownerReferences?: Array<{
      kind: string;
      name: string;
    }>;
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
    creationTimestamp: string;
  };
  spec: {
    replicas?: number;
  };
  status: {
    replicas?: number;
    readyReplicas?: number;
    updatedReplicas?: number;
    availableReplicas?: number;
    conditions?: any[];
  };
};

export type LifecycleResponse<T> = {
  namespace: string;
  items: T[];
  updatedAt: string;
};

// Legacy PodRow type for backward compatibility (extracted from k8s objects)
export type PodRow = {
  name: string;
  namespace: string;
  node: string;
  podIP: string;
  phase: string;
  ready: boolean;
  restarts: number;
  startTime: string | null;
  ownerKind: string | null;
  ownerName: string | null;
  containers: { name: string; image: string }[];
};

// Legacy DeployRow type for backward compatibility (extracted from k8s objects)
export type DeployRow = {
  name: string;
  namespace: string;
  replicas: number;
  ready: number;
  updated: number;
  available: number;
  conditions: any[];
};

const base = (window as any).getApiBase?.() || (window as any).SAGE_API_BASE || '/api';

// Extract PodRow from raw K8s pod
function extractPodRow(pod: K8sPod): PodRow {
  const meta = pod.metadata || {};
  const status = pod.status || {};
  const containers = status.containerStatuses || [];
  const ready = containers.length > 0 && containers.every(c => c.ready);
  const restarts = containers.reduce((sum, c) => sum + (c.restartCount || 0), 0);
  const owner = meta.ownerReferences?.[0];

  return {
    name: meta.name || '',
    namespace: meta.namespace || '',
    node: status.hostIP || '',
    podIP: status.podIP || '',
    phase: status.phase || 'Unknown',
    ready,
    restarts,
    startTime: meta.creationTimestamp || null,
    ownerKind: owner?.kind || null,
    ownerName: owner?.name || null,
    containers: containers.map(c => ({ name: '', image: '' })), // Simplified for now
  };
}

// Extract DeployRow from raw K8s deployment
function extractDeployRow(deploy: K8sDeployment): DeployRow {
  const meta = deploy.metadata || {};
  const spec = deploy.spec || {};
  const status = deploy.status || {};

  return {
    name: meta.name || '',
    namespace: meta.namespace || '',
    replicas: spec.replicas || 0,
    ready: status.readyReplicas || 0,
    updated: status.updatedReplicas || 0,
    available: status.availableReplicas || 0,
    conditions: status.conditions || [],
  };
}

export async function getPods(ns = 'arc-ui'): Promise<PodRow[]> {
  try {
    const r = await fetch(`${base}/lifecycle/pods?ns=${encodeURIComponent(ns)}`, { credentials: 'omit' });
    if (!r.ok) return [];
    const j: LifecycleResponse<K8sPod> = await r.json();
    if (!Array.isArray(j.items)) return [];
    return j.items.map(extractPodRow);
  } catch (err) {
    console.error('Error fetching pods:', err);
    return [];
  }
}

export async function getDeploys(ns = 'arc-ui'): Promise<DeployRow[]> {
  try {
    const r = await fetch(`${base}/lifecycle/deploys?ns=${encodeURIComponent(ns)}`, { credentials: 'omit' });
    if (!r.ok) return [];
    const j: LifecycleResponse<K8sDeployment> = await r.json();
    if (!Array.isArray(j.items)) return [];
    return j.items.map(extractDeployRow);
  } catch (err) {
    console.error('Error fetching deployments:', err);
    return [];
  }
}

export async function getSummary(ns = 'arc-ui') {
  const r = await fetch(`${base}/lifecycle/summary?ns=${encodeURIComponent(ns)}`, { credentials: 'omit' });
  if (!r.ok) return { totals: { pods: 0, healthy: 0, degraded: 0, deployments: 0 }, updatedAt: new Date().toISOString() };
  const j = await r.json();
  const t = j?.totals || {};
  return {
    totals: {
      pods: Number(t.pods) || 0,
      healthy: Number(t.healthy) || 0,
      degraded: Number(t.degraded) || 0,
      deployments: Number(t.deployments) || 0,
    },
    updatedAt: j?.updatedAt || new Date().toISOString(),
  };
}

export async function getPodDetails(ns: string, name: string) {
  const r = await fetch(`${base}/lifecycle/pod/${encodeURIComponent(ns)}/${encodeURIComponent(name)}`, { credentials: 'omit' });
  if (!r.ok) return null;
  return r.json();
}
