// 💓 Federation Heartbeat Store
// Manages unified federation heartbeat state

export type FederationStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'DEGRADED' | 'UNKNOWN' | 'UNREACHABLE';

interface HeartbeatState {
  heartbeat: any | null;
}

let state: HeartbeatState = {
  heartbeat: null,
};

type Listener = () => void;
const listeners = new Set<Listener>();

export function getHeartbeat() {
  return state.heartbeat;
}

export function getStatus(): FederationStatus {
  const hb = state.heartbeat;
  if (!hb) return 'UNKNOWN';
  return (hb.status as FederationStatus) || 'UNKNOWN';
}

export function getReason(): string | null {
  return state.heartbeat?.reason ?? null;
}

export function getLastUpdated(): string | null {
  return state.heartbeat?.timestamp ?? state.heartbeat?.updatedAt ?? null;
}

export function getLatencyMs(): number | null {
  return state.heartbeat?.latencyMs ?? null;
}

export function getDriftMs(): number | null {
  return state.heartbeat?.driftMs ?? null;
}

export function getKubeApiReachable(): boolean | null {
  return state.heartbeat?.kubeApiReachable ?? null;
}

export function getLifecycleOk(): boolean | null {
  return state.heartbeat?.lifecycleOk ?? null;
}

export function getTopologyOk(): boolean | null {
  return state.heartbeat?.topologyOk ?? null;
}

export function getSignals() {
  return state.heartbeat?.signals ?? null;
}

export function getMeshId(): string | null {
  return state.heartbeat?.meshId ?? null;
}

export function getClusterId(): string | null {
  return state.heartbeat?.clusterId ?? null;
}

export type DependencyStatus = 'healthy' | 'degraded' | 'offline';

export interface DependencyInfo {
  status: DependencyStatus;
  reason: string;
}

export interface Dependencies {
  kubeApi: DependencyInfo;
  topology: DependencyInfo;
  signals: DependencyInfo;
}

export function getDependencies(): Dependencies {
  const hb = state.heartbeat;
  if (!hb) {
    return {
      kubeApi: { status: 'offline', reason: 'Heartbeat unavailable' },
      topology: { status: 'offline', reason: 'Heartbeat unavailable' },
      signals: { status: 'offline', reason: 'Heartbeat unavailable' },
    };
  }

  const status = hb.status || 'UNREACHABLE';
  const latencyMsDetailed = hb.latencyMsDetailed || {};
  const signals = hb.signals || {};
  const nodeCount = hb.nodeCount ?? 0;
  const podCount = hb.podCount ?? 0;

  // Kube API (Lifecycle) dependency
  let kubeApiStatus: DependencyStatus = 'healthy';
  let kubeApiReason = 'Kube API responsive';
  
  if (status === 'UNREACHABLE' || (podCount === 0 && nodeCount >= 1)) {
    kubeApiStatus = 'offline';
    kubeApiReason = hb.reason || 'Cluster API unreachable from inside mesh.';
  } else if (latencyMsDetailed.lifecycle !== undefined && latencyMsDetailed.lifecycle > 1000) {
    kubeApiStatus = 'degraded';
    kubeApiReason = `Elevated latency: ${latencyMsDetailed.lifecycle}ms`;
  } else if (latencyMsDetailed.lifecycle === -1 || latencyMsDetailed.lifecycle === null) {
    kubeApiStatus = 'offline';
    kubeApiReason = 'Lifecycle queries timing out';
  } else if (!hb.lifecycleOk) {
    kubeApiStatus = 'degraded';
    kubeApiReason = 'Lifecycle queries failing';
  }

  // Topology dependency
  let topologyStatus: DependencyStatus = 'healthy';
  let topologyReason = 'Topology responsive';
  
  if (latencyMsDetailed.topology === undefined || latencyMsDetailed.topology === null) {
    topologyStatus = 'offline';
    topologyReason = 'Topology data unavailable';
  } else if (latencyMsDetailed.topology > 500) {
    topologyStatus = 'degraded';
    topologyReason = `Elevated latency: ${latencyMsDetailed.topology}ms`;
  } else if (!hb.topologyOk) {
    topologyStatus = 'degraded';
    topologyReason = 'Topology queries failing';
  }

  // Signals dependency
  let signalsStatus: DependencyStatus = 'healthy';
  let signalsReason = 'Signals stream healthy';
  
  if (latencyMsDetailed.signals === undefined || latencyMsDetailed.signals === null) {
    signalsStatus = 'offline';
    signalsReason = 'Signals stream unavailable';
  } else if (signals.anomalies24h > 0 || signals.warningOpen > 0 || signals.criticalOpen > 0) {
    signalsStatus = 'degraded';
    const issues = [];
    if (signals.criticalOpen > 0) issues.push(`${signals.criticalOpen} critical`);
    if (signals.warningOpen > 0) issues.push(`${signals.warningOpen} warnings`);
    if (signals.anomalies24h > 0) issues.push(`${signals.anomalies24h} anomalies`);
    signalsReason = `Active issues: ${issues.join(', ')}`;
  } else if (latencyMsDetailed.signals > 500) {
    signalsStatus = 'degraded';
    signalsReason = `Elevated latency: ${latencyMsDetailed.signals}ms`;
  }

  return {
    kubeApi: { status: kubeApiStatus, reason: kubeApiReason },
    topology: { status: topologyStatus, reason: topologyReason },
    signals: { status: signalsStatus, reason: signalsReason },
  };
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setHeartbeat(next: any) {
  // UI-G2: Ensure clean heartbeat object with fallbacks (no null errors)
  if (!next) {
    state.heartbeat = null;
    listeners.forEach((l) => l());
    return;
  }

  state.heartbeat = {
    status: next.status ?? 'UNREACHABLE',
    latencyMs: next.latencyMs ?? null,
    driftMs: next.driftMs ?? null,
    signals: next.signals ?? {
      totalEvents24h: 0,
      anomalies24h: 0,
      warningOpen: 0,
      criticalOpen: 0,
    },
    // Preserve all other fields for backward compatibility
    ...next,
  };

  listeners.forEach((l) => l());
}

