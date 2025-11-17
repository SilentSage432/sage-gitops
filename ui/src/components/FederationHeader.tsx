// 🌐 Federation Header
// Displays federation status at a glance using heartbeat as source of truth
// UI-G2: Enhanced with smooth pulsing, gradient transitions, and signal counters

import React, { useEffect, useState } from 'react';
import { getHeartbeat, getStatus, getReason, getMeshId, getClusterId, subscribe } from '../stores/heartbeatStore';
import type { FederationStatus } from '../stores/heartbeatStore';

const getStatusClass = (status: FederationStatus | string | null): string => {
  if (!status) return 'status-red';
  if (status === 'HEALTHY') return 'status-green';
  if (status === 'DEGRADED' || status === 'WARNING') return 'status-yellow';
  if (status === 'UNREACHABLE') return 'status-red';
  return 'status-red';
};

const getStatusLabel = (status: FederationStatus | string | null): string => {
  if (!status) return 'Federation: Unknown';
  if (status === 'HEALTHY') return 'Federation: Stable';
  if (status === 'DEGRADED' || status === 'WARNING') return 'Federation: Degraded';
  if (status === 'UNREACHABLE') return 'Federation: Unreachable';
  return 'Federation: Unknown';
};

export const FederationHeader: React.FC = () => {
  const [heartbeat, setHeartbeat] = useState(() => getHeartbeat());
  const [status, setStatus] = useState(() => getStatus());
  const [reason, setReason] = useState(() => getReason());
  const [meshId, setMeshId] = useState(() => getMeshId());
  const [clusterId, setClusterId] = useState(() => getClusterId());
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Subscribe to heartbeat store changes
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      const hb = getHeartbeat();
      setHeartbeat(hb);
      setStatus(getStatus());
      setReason(getReason());
      setMeshId(getMeshId());
      setClusterId(getClusterId());
      setFetchError(null);
    });

    return unsubscribe;
  }, []);

  // Fallback polling if SSE doesn't provide heartbeat
  useEffect(() => {
    async function fetchHeartbeat() {
      try {
        const base = (window as any).getApiBase?.() || (window as any).SAGE_API_BASE || '/api';
        const res = await fetch(`${base}/federation/heartbeat`, { credentials: 'omit' });
        if (res.ok) {
          const data = await res.json();
          // Update store will trigger subscription
          const { setHeartbeat } = await import('../stores/heartbeatStore');
          setHeartbeat(data);
          setFetchError(null);
        } else {
          setFetchError('Heartbeat fetch failed');
        }
      } catch (err: any) {
        setFetchError('Heartbeat fetch failed');
        console.error('[FederationHeader] Error fetching heartbeat:', err);
      }
    }

    // Initial fetch
    fetchHeartbeat();
    // Poll every 10 seconds as fallback
    const interval = setInterval(fetchHeartbeat, 10000);
    return () => clearInterval(interval);
  }, []);

  const displayStatus = fetchError ? null : status;
  const displayReason = fetchError 
    ? 'Waiting for federation heartbeat…' 
    : (reason || 'Status unknown');

  const statusClass = getStatusClass(displayStatus);
  const statusLabel = getStatusLabel(displayStatus);

  // Ensure clean heartbeat object with fallbacks
  const cleanHb = heartbeat ? {
    status: heartbeat.status ?? 'UNREACHABLE',
    latencyMs: heartbeat.latencyMs ?? null,
    driftMs: heartbeat.driftMs ?? null,
    signals: heartbeat.signals ?? {
      totalEvents24h: 0,
      anomalies24h: 0,
      warningOpen: 0,
      criticalOpen: 0,
    },
  } : null;

  return (
    <div className="fed-status">
      <div className={`crown ${statusClass}`} />
      <div className="status-text">
        <strong>{statusLabel}</strong>
        <div className="sub">
          <span>Latency: {cleanHb?.latencyMs ?? '—'}ms</span>
          <span>Drift: {cleanHb?.driftMs ?? '—'}ms</span>
        </div>
      </div>
      <div className="signals">
        <span className="sig">Events 24h: {cleanHb?.signals?.totalEvents24h ?? 0}</span>
        <span className="sig">Anomalies: {cleanHb?.signals?.anomalies24h ?? 0}</span>
        <span className="sig">Warnings: {cleanHb?.signals?.warningOpen ?? 0}</span>
      </div>
    </div>
  );
};

