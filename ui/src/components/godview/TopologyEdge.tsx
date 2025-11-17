// 🔗 Topology Edge Component
// Renders an edge with hover tooltip and click handler for insight panel

import React, { useState } from 'react';
import { setSelectedEdgeId } from '../../stores/godviewStore';
import type { EdgeIntelligence } from '../../lib/topology/edgeIntelligence';

interface EdgeData {
  id: string;
  source: string;
  target: string;
  intent: string;
  arc?: string;
  layer?: string;
  status?: string;
}

interface TopologyEdgeProps {
  edge: EdgeData;
  intelligence?: EdgeIntelligence | null;
  lifecycleStatus: 'LIVE' | 'DEGRADED' | 'OFFLINE' | 'BROKEN';
  lifecycleReachable: boolean;
  className?: string;
}

export const TopologyEdge: React.FC<TopologyEdgeProps> = ({
  edge,
  intelligence,
  lifecycleStatus,
  lifecycleReachable,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Get pulse color based on lifecycle status
  const getPulseColor = (): string => {
    if (!lifecycleReachable) {
      return '#64748b'; // gray - lifecycle unreachable
    }
    switch (lifecycleStatus) {
      case 'LIVE':
        return '#10b981'; // green
      case 'DEGRADED':
        return '#f59e0b'; // amber
      case 'OFFLINE':
      case 'BROKEN':
        return '#ef4444'; // red
      default:
        return '#64748b'; // gray
    }
  };

  // Get edge color from intelligence or fallback to pulse color
  const getEdgeColor = (): string => {
    if (intelligence?.healthStatus) {
      switch (intelligence.healthStatus) {
        case 'healthy':
          return '#10b981'; // green-500
        case 'degraded':
          return '#f59e0b'; // amber-500
        case 'broken':
          return '#ef4444'; // red-500
        case 'unknown':
        default:
          return '#64748b'; // slate-500
      }
    }
    return getPulseColor();
  };

  const edgeColor = getEdgeColor();
  const pulseColor = getPulseColor();
  const thickness = intelligence ? Math.max(1, Math.min(4, Math.round(intelligence.confidenceScore * 3 + 1))) : 2;
  const isDegraded = intelligence?.healthStatus === 'degraded' || lifecycleStatus === 'DEGRADED';

  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsHovered(true);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isHovered) {
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleClick = () => {
    setSelectedEdgeId(edge.id);
  };

  return (
    <>
      <div
        key={edge.id}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`rounded border border-slate-800 bg-slate-900/50 p-3 transition-all cursor-pointer hover:bg-slate-900/70 hover:border-slate-700 ${className}`}
        style={{
          borderLeftWidth: `${thickness}px`,
          borderLeftColor: edgeColor,
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="font-mono text-xs text-cyan-300 truncate">
                {edge.intent}
              </div>
              {/* Pulse indicator */}
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: pulseColor,
                  boxShadow: isDegraded ? `0 0 6px ${pulseColor}80` : `0 0 4px ${pulseColor}40`,
                  animation: isDegraded ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
                title={`Lifecycle: ${lifecycleStatus}${!lifecycleReachable ? ' (unreachable)' : ''}`}
              />
            </div>
            <div className="text-xs text-slate-400 font-mono">
              <span className="text-slate-300">{edge.source}</span>
              <span className="mx-2 text-slate-600">
                {isDegraded ? '⇢' : '→'}
              </span>
              <span className="text-slate-300">{edge.target}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {intelligence?.healthStatus && (
              <span
                className="px-2 py-0.5 rounded-full text-[9px] font-semibold border"
                style={{
                  backgroundColor: `${edgeColor}20`,
                  color: `${edgeColor}cc`,
                  borderColor: `${edgeColor}40`,
                }}
              >
                {intelligence.healthStatus.toUpperCase()}
              </span>
            )}
            {intelligence && (
              <div className="text-[8px] text-slate-500">
                {(intelligence.confidenceScore * 100).toFixed(0)}% conf
              </div>
            )}
          </div>
        </div>
        {/* Visual edge representation */}
        {intelligence && (
          <div className="mt-2 pt-2 border-t border-slate-800">
            <div className="relative h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 transition-all"
                style={{
                  width: `${intelligence.confidenceScore * 100}%`,
                  backgroundColor: edgeColor,
                  opacity: isDegraded ? 0.7 : 1,
                  animation: isDegraded ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Hover Tooltip */}
      {isHovered && (
        <div
          className="fixed z-50 px-3 py-2 rounded-lg bg-slate-900/95 backdrop-blur-sm border border-slate-700 shadow-lg pointer-events-none text-xs"
          style={{
            left: `${tooltipPosition.x + 12}px`,
            top: `${tooltipPosition.y - 12}px`,
            transform: 'translateY(-100%)',
          }}
        >
          <div className="space-y-1">
            <div className="font-mono text-cyan-300">{edge.intent}</div>
            <div className="text-slate-300">
              <span className="font-mono">{edge.source}</span>
              <span className="mx-1 text-slate-500">→</span>
              <span className="font-mono">{edge.target}</span>
            </div>
            {edge.arc && (
              <div className="text-slate-400">
                Arc: <span className="text-slate-300">{edge.arc}</span>
              </div>
            )}
            {(edge.status || intelligence?.healthStatus) && (
              <div className="text-slate-400">
                Status: <span className="text-slate-300">{(edge.status || intelligence?.healthStatus || 'unknown').toUpperCase()}</span>
              </div>
            )}
            <div className="text-slate-400 pt-1 border-t border-slate-700">
              Click to view details
            </div>
          </div>
        </div>
      )}
    </>
  );
};
