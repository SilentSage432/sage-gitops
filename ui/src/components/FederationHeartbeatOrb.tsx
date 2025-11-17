// 💓 Federation Heartbeat Orb
// Visual pulsing indicator for federation health status with diagnostic tooltip

import React, { useState } from 'react';
import { FederationStatus, getLatencyMs, getDriftMs, getLastUpdated } from '../stores/heartbeatStore';

interface Props {
  status: FederationStatus;
}

export const FederationHeartbeatOrb: React.FC<Props> = ({ status }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const color = (() => {
    switch (status) {
      case 'HEALTHY':
        return 'bg-emerald-400';
      case 'WARNING':
      case 'DEGRADED':
        return 'bg-amber-400';
      case 'CRITICAL':
      case 'UNREACHABLE':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  })();

  const latencyMs = getLatencyMs();
  const driftMs = getDriftMs();
  const lastUpdated = getLastUpdated();

  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`w-3 h-3 rounded-full ${color} animate-ping opacity-60`} style={{ animationDuration: '2s' }} />
      <div className={`absolute w-2 h-2 rounded-full ${color}`} />
      
      {/* Diagnostic Tooltip */}
      {showTooltip && (
        <div className="absolute left-0 top-6 z-50 w-48 rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-lg">
          <div className="text-xs space-y-1">
            <div className="font-semibold text-slate-100 mb-2">Mesh Health Diagnostics</div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className={`font-medium ${
                status === 'HEALTHY' ? 'text-emerald-400' :
                status === 'DEGRADED' ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {status}
              </span>
            </div>
            {latencyMs !== null && (
              <div className="flex justify-between">
                <span className="text-slate-400">Latency:</span>
                <span className="text-slate-200">{latencyMs} ms</span>
              </div>
            )}
            {driftMs !== null && (
              <div className="flex justify-between">
                <span className="text-slate-400">Clock Drift:</span>
                <span className="text-slate-200">{driftMs} ms</span>
              </div>
            )}
            {lastUpdated && (
              <div className="flex justify-between pt-1 border-t border-slate-700">
                <span className="text-slate-400">Updated:</span>
                <span className="text-slate-200 text-[10px]">
                  {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

