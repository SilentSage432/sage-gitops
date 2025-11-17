// 🔌 Dependency Matrix
// Shows health status of backend dependencies (Kube API, Topology, Signals)

import React from 'react';
import type { Dependencies, DependencyStatus } from '../stores/heartbeatStore';

interface Props {
  deps: Dependencies | null;
}

const getStatusColor = (status: DependencyStatus): string => {
  switch (status) {
    case 'healthy':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'degraded':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'offline':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

export const DependencyMatrix: React.FC<Props> = ({ deps }) => {
  if (!deps) {
    return (
      <div className="flex gap-2 text-xs text-slate-500">
        <span>Dependencies: unknown</span>
      </div>
    );
  }

  const badges = [
    { label: 'Kube API', dep: deps.kubeApi },
    { label: 'Topology', dep: deps.topology },
    { label: 'Signals', dep: deps.signals },
  ];

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {badges.map((badge) => (
        <div
          key={badge.label}
          className={`px-2 py-1 rounded border ${getStatusColor(badge.dep.status)}`}
          title={badge.dep.reason}
        >
          <div className="font-medium">{badge.label}</div>
          <div className="text-[10px] opacity-80 mt-0.5 max-w-[120px] truncate">
            {badge.dep.reason}
          </div>
        </div>
      ))}
    </div>
  );
};

