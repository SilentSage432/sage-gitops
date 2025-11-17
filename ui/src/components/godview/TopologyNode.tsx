// 🔵 Topology Node Component
// Renders a node with hover tooltip

import React, { useState } from 'react';
import type { NodeInfo } from '../../api/godviewClient';

interface TopologyNodeProps {
  node: NodeInfo;
  className?: string;
}

export const TopologyNode: React.FC<TopologyNodeProps> = ({
  node,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

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

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'ready':
      case 'healthy':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'degraded':
      case 'warning':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'unreachable':
      case 'broken':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`p-2 rounded-md bg-slate-700 text-slate-100 text-xs border border-slate-600 shadow-md transition-all hover:bg-slate-600 hover:border-slate-500 ${className}`}
        title={`Node: ${node.name} - Status: ${node.status || 'unknown'}`}
      >
        <div className="flex items-center gap-2">
          <div className="font-mono text-cyan-300 truncate">{node.name}</div>
          {node.status && (
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold border flex-shrink-0 ${getStatusColor(node.status)}`}>
              {(node.status || 'unknown').toUpperCase()}
            </span>
          )}
        </div>
        {node.internalIP && (
          <div className="text-[10px] text-slate-400 font-mono mt-1 truncate">
            {node.internalIP}
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
            <div className="font-mono text-cyan-300 font-semibold">{node.name}</div>
            {node.internalIP && (
              <div className="text-slate-300">
                IP: <span className="font-mono text-slate-400">{node.internalIP}</span>
              </div>
            )}
            {node.status && (
              <div className="text-slate-400">
                Status: <span className="text-slate-300">{node.status.toUpperCase()}</span>
              </div>
            )}
            {node.roles && node.roles.length > 0 && (
              <div className="text-slate-400">
                Roles: <span className="text-slate-300">{node.roles.join(', ')}</span>
              </div>
            )}
            {node.architecture && (
              <div className="text-slate-400">
                Arch: <span className="text-slate-300">{node.architecture}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
