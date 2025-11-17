// 🕸️ Topology Graph Component
// Visual graph rendering with edge intelligence styling

import React from 'react';
import type { EnhancedTopology } from '../lib/topology/edgeIntelligence';
import { TopologyEdge } from './godview/TopologyEdge';

interface TopologyGraphProps {
  topology: EnhancedTopology | null;
  lifecycleStatus: 'LIVE' | 'DEGRADED' | 'OFFLINE' | 'BROKEN';
  lifecycleReachable: boolean;
  className?: string;
}

export const TopologyGraph: React.FC<TopologyGraphProps> = ({
  topology,
  lifecycleStatus,
  lifecycleReachable,
  className = '',
}) => {
  if (!topology || !topology.edgeIntelligence || topology.edgeIntelligence.size === 0) {
    return (
      <div className={`rounded-lg border border-slate-800 bg-slate-950/50 p-12 text-center ${className}`}>
        <div className="text-xs text-slate-500">
          No topology edges to display
        </div>
      </div>
    );
  }

  const edges = topology.edges;
  const edgeIntelligence = topology.edgeIntelligence;

  // Simple horizontal layout for now (can be enhanced with D3/vis.js later)
  return (
    <div className={`rounded-lg border border-slate-800 bg-slate-950/50 p-4 ${className}`}>
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Topology Graph
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {edges.map((edge) => {
          const intel = edgeIntelligence.get(edge.id);
          return (
            <TopologyEdge
              key={edge.id}
              edge={edge}
              intelligence={intel || undefined}
              lifecycleStatus={lifecycleStatus}
              lifecycleReachable={lifecycleReachable}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-2">Legend</div>
        <div className="flex flex-wrap gap-3 text-[9px]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-slate-400">Healthy / LIVE</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-400">Degraded</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-slate-400">Broken / OFFLINE</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-slate-500" />
            <span className="text-slate-400">Unknown / Unreachable</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="text-slate-400">Line thickness = confidence</div>
          </div>
        </div>
      </div>
    </div>
  );
};

