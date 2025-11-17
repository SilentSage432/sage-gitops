// 🌐 Federation Status Bar
// Real-time federation health and summary display

import React, { useEffect, useState } from 'react';
import { getFederationSummary, type FederationHealthStatus, subscribe as subscribeGodview } from '../stores/godviewStore';
import { getLifecycleSummary, type LifecycleHealthStatus, subscribe as subscribeLifecycle } from '../stores/lifecycleStore';
import { getHeartbeat, getStatus as getHeartbeatStatus, getLastUpdated as getHeartbeatLastUpdated, subscribe as subscribeHeartbeat, type FederationStatus } from '../stores/heartbeatStore';
import { FederationHeartbeatOrb } from './FederationHeartbeatOrb';

const statusClass = (status: FederationHealthStatus | LifecycleHealthStatus | FederationStatus | string) => {
  switch (status) {
    case 'HEALTHY':
      return 'bg-green-600 text-white';
    case 'WARNING':
    case 'DEGRADED':
      return 'bg-yellow-500 text-black';
    case 'CRITICAL':
      return 'bg-red-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
};

export const FederationStatusBar: React.FC = () => {
  const [federation, setFederation] = useState(() => getFederationSummary());
  const [lifecycle, setLifecycle] = useState(() => getLifecycleSummary());
  const [heartbeatStatus, setHeartbeatStatus] = useState(() => getHeartbeatStatus());
  const [heartbeatUpdatedAt, setHeartbeatUpdatedAt] = useState(() => getHeartbeatLastUpdated());
  const [heartbeat, setHeartbeat] = useState(() => getHeartbeat());

  useEffect(() => {
    const unsubHb = subscribeHeartbeat(() => {
      setHeartbeat(getHeartbeat());
      setHeartbeatStatus(getHeartbeatStatus());
      setHeartbeatUpdatedAt(getHeartbeatLastUpdated());
    });

    const unsubGodview = subscribeGodview(() => {
      setFederation(getFederationSummary());
    });

    const unsubLifecycle = subscribeLifecycle(() => {
      setLifecycle(getLifecycleSummary());
    });

    return () => {
      unsubHb?.();
      unsubGodview?.();
      unsubLifecycle?.();
    };
  }, []);

  const statusToShow = heartbeatStatus !== 'UNKNOWN' ? heartbeatStatus : federation.status;
  const lastUpdatedToShow = heartbeatUpdatedAt || federation.lastUpdated;

  return (
    <div className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-between px-4 py-2 gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <FederationHeartbeatOrb status={statusToShow} />
          <span className="text-xs uppercase tracking-wide text-slate-400">Federation</span>
        </div>
        <span className="text-sm text-slate-200 font-medium">
          {heartbeat?.meshId || federation.meshId} · {heartbeat?.clusterId || federation.clusterId}
        </span>
        <span className="text-xs text-slate-400">
          Nodes: <span className="text-slate-100">{heartbeat?.nodeCount ?? federation.nodeCount}</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xs text-slate-400">
          Pods: <span className="text-slate-100">{heartbeat?.podCount ?? lifecycle.podCount}</span> ·
          Deploys: <span className="text-slate-100">{heartbeat?.deployCount ?? lifecycle.deployCount}</span>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClass(statusToShow)}`}>
          {statusToShow}
        </div>
        {(lifecycle.status === 'DEGRADED' || heartbeatStatus === 'WARNING' || heartbeatStatus === 'DEGRADED') && (
          <span className="text-xs text-amber-400">
            {heartbeat?.reason || 'Lifecycle: degraded / retrying…'}
          </span>
        )}
        {lastUpdatedToShow && (
          <span className="text-[10px] text-slate-500">
            Updated {new Date(lastUpdatedToShow).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
};

