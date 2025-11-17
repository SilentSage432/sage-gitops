// 🔧 Lifecycle State Store
// Manages pods and deployments state for real-time updates

import type { K8sPod, K8sDeployment, LifecycleStatus } from '../api/lifecycleClient';

export type LifecycleHealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNKNOWN';

let pods: K8sPod[] = [];
let deployments: K8sDeployment[] = [];
let lastUpdated: string = '';
let status: LifecycleStatus = 'loading';
let reason: string | null = null;
const listeners = new Set<() => void>();

export function getPods(): K8sPod[] {
  return pods;
}

export function getDeployments(): K8sDeployment[] {
  return deployments;
}

export function getLastUpdated(): string {
  return lastUpdated;
}

export function setPods(newPods: K8sPod[]) {
  pods = newPods;
  lastUpdated = new Date().toISOString();
  // Notify all listeners
  listeners.forEach(listener => listener());
}

export function setDeployments(newDeployments: K8sDeployment[]) {
  deployments = newDeployments;
  lastUpdated = new Date().toISOString();
  // Notify all listeners
  listeners.forEach(listener => listener());
}

export function getLifecycleSummary() {
  const podCount = pods.length;
  const deployCount = deployments.length;
  const hasAnyData = podCount > 0 || deployCount > 0;

  let status: LifecycleHealthStatus = 'UNKNOWN';

  if (!hasAnyData) {
    status = 'UNKNOWN';
  } else {
    // Check if all pods are running
    const allRunning = pods.length > 0 && pods.every(p => {
      const phase = (p.status?.phase || '').toLowerCase();
      return phase === 'running';
    });

    if (allRunning) {
      status = 'HEALTHY';
    } else {
      status = 'DEGRADED';
    }
  }

  return {
    podCount,
    deployCount,
    lastUpdated: lastUpdated || null,
    status,
  };
}

export function getStatus(): LifecycleStatus {
  return status;
}

export function getStatusReason(): string | null {
  return reason;
}

export function setStatus(newStatus: LifecycleStatus, newReason: string | null = null) {
  status = newStatus;
  reason = newReason;
  listeners.forEach(listener => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

