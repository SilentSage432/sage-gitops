// 📋 Topology Details Panel Component
// Shows detailed information for selected node or route

import React from 'react';
import { getSelectedNodeId, getSelectedRouteId, clearSelection, getEnhancedTopology, getNormalizedTopology } from '../../stores/godviewStore';
import type { NodeInfo } from '../../api/godviewClient';

interface TopologyDetailsPanelProps {
  className?: string;
}

export const TopologyDetailsPanel: React.FC<TopologyDetailsPanelProps> = ({ className = '' }) => {
  const selectedNodeId = getSelectedNodeId();
  const selectedRouteId = getSelectedRouteId();
  const enhanced = getEnhancedTopology();
  const normalized = getNormalizedTopology();

  // Get selected node details
  const selectedNode = selectedNodeId && enhanced
    ? enhanced.nodes.find(n => n.name === selectedNodeId)
    : null;

  // Get selected route/edge details
  const selectedEdge = selectedRouteId && enhanced
    ? enhanced.edges.find(e => e.id === selectedRouteId)
    : null;

  const selectedEdgeIntelligence = selectedRouteId && enhanced
    ? enhanced.edgeIntelligence.get(selectedRouteId)
    : null;

  // Helper to get status color
  const getStatusColor = (status: string | undefined) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'healthy':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'degraded':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'broken':
      case 'unreachable':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Helper to get health status color
  const getHealthColor = (health: string | undefined) => {
    const h = (health || '').toLowerCase();
    switch (h) {
      case 'healthy':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'degraded':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'broken':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  if (!selectedNode && !selectedEdge) {
    return (
      <div className={`rounded-lg border border-slate-800 bg-slate-950/50 p-12 text-center ${className}`}>
        <div className="max-w-md mx-auto space-y-3">
          <div className="text-sm font-semibold text-slate-200">
            No selection
          </div>
          <div className="text-xs text-slate-400">
            Click a node or route to inspect details
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-slate-800 bg-slate-950/50 p-4 space-y-4 ${className}`}>
      {/* Header with close button */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
          {selectedNode ? 'Node Details' : 'Route Details'}
        </div>
        <button
          onClick={clearSelection}
          className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 rounded hover:border-slate-700 transition-all"
        >
          ✕ Close
        </button>
      </div>

      {/* Node Details */}
      {selectedNode && (
        <div className="space-y-3">
          <div>
            <div className="text-[10px] text-slate-500 uppercase mb-1">Name</div>
            <div className="font-mono text-sm text-cyan-300">{selectedNode.name}</div>
          </div>

          {selectedNode.status && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase mb-1">Status</div>
              <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-semibold border ${getStatusColor(selectedNode.status)}`}>
                {(selectedNode.status || 'unknown').toUpperCase()}
              </span>
            </div>
          )}

          {selectedNode.internalIP && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase mb-1">Internal IP</div>
              <div className="font-mono text-xs text-slate-400">{selectedNode.internalIP}</div>
            </div>
          )}

          {selectedNode.roles && selectedNode.roles.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase mb-1">Roles</div>
              <div className="flex flex-wrap gap-1">
                {selectedNode.roles.map((role, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-800/50 text-xs text-slate-300 border border-slate-700">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedNode.architecture && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase mb-1">Architecture</div>
              <div className="text-xs text-slate-400">{selectedNode.architecture}</div>
            </div>
          )}

          {/* Find edges connected to this node */}
          {enhanced && enhanced.edges && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase mb-2">Connected Routes</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {enhanced.edges
                  .filter(edge => edge.source === selectedNode.name || edge.target === selectedNode.name)
                  .map(edge => {
                    const intel = enhanced.edgeIntelligence.get(edge.id);
                    return (
                      <div key={edge.id} className="px-2 py-1 rounded bg-slate-900/50 border border-slate-800">
                        <div className="font-mono text-xs text-cyan-300 truncate">{edge.intent}</div>
                        <div className="text-[10px] text-slate-400">
                          {edge.source} → {edge.target}
                          {edge.arc && ` · ${edge.arc}`}
                        </div>
                        {intel && (
                          <span className={`inline-block mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${getHealthColor(intel.healthStatus)}`}>
                            {intel.healthStatus.toUpperCase()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                {enhanced.edges.filter(e => e.source === selectedNode.name || e.target === selectedNode.name).length === 0 && (
                  <div className="text-xs text-slate-500 italic">No routes found</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Route/Edge Details */}
      {selectedEdge && (
        <div className="space-y-3">
          <div>
            <div className="text-[10px] text-slate-500 uppercase mb-1">Intent</div>
            <div className="font-mono text-sm text-cyan-300">{selectedEdge.intent || '—'}</div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase mb-1">Route ID</div>
            <div className="font-mono text-xs text-slate-400">{selectedEdge.id}</div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase mb-1">Connection</div>
            <div className="text-xs text-slate-300">
              <span className="font-mono text-cyan-300">{selectedEdge.source || '—'}</span>
              <span className="mx-2 text-slate-600">→</span>
              <span className="font-mono text-cyan-300">{selectedEdge.target || '—'}</span>
            </div>
          </div>

          {selectedEdge.arc && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase mb-1">Arc</div>
              <div className="text-xs text-slate-400">{selectedEdge.arc}</div>
            </div>
          )}

          {selectedEdge.layer && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase mb-1">Layer</div>
              <div className="text-xs text-slate-400">{selectedEdge.layer}</div>
            </div>
          )}

          {selectedEdge.status && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase mb-1">Status</div>
              <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-semibold border ${getStatusColor(selectedEdge.status)}`}>
                {(selectedEdge.status || 'unknown').toUpperCase()}
              </span>
            </div>
          )}

          {selectedEdgeIntelligence && (
            <>
              <div>
                <div className="text-[10px] text-slate-500 uppercase mb-1">Health Status</div>
                <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-semibold border ${getHealthColor(selectedEdgeIntelligence.healthStatus)}`}>
                  {selectedEdgeIntelligence.healthStatus.toUpperCase()}
                </span>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase mb-1">Confidence</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all"
                      style={{ width: `${selectedEdgeIntelligence.confidenceScore * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 w-12 text-right">
                    {(selectedEdgeIntelligence.confidenceScore * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {selectedEdgeIntelligence.inferred && (
                <div>
                  <div className="text-[10px] text-slate-500 uppercase mb-1">Source</div>
                  <div className="text-xs text-amber-400">Inferred (lifecycle offline)</div>
                </div>
              )}
            </>
          )}

          {/* Find related routes in same arc */}
          {enhanced && selectedEdge.arc && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase mb-2">Related Routes ({selectedEdge.arc})</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {enhanced.edges
                  .filter(edge => edge.id !== selectedEdge.id && edge.arc === selectedEdge.arc)
                  .slice(0, 5)
                  .map(edge => {
                    const intel = enhanced.edgeIntelligence.get(edge.id);
                    return (
                      <div key={edge.id} className="px-2 py-1 rounded bg-slate-900/50 border border-slate-800">
                        <div className="font-mono text-xs text-cyan-300 truncate">{edge.intent}</div>
                        {intel && (
                          <span className={`inline-block mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${getHealthColor(intel.healthStatus)}`}>
                            {intel.healthStatus.toUpperCase()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                {enhanced.edges.filter(e => e.id !== selectedEdge.id && e.arc === selectedEdge.arc).length === 0 && (
                  <div className="text-xs text-slate-500 italic">No related routes found</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

