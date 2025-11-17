// 📋 Route Details Panel Component
// Shows detailed information for selected route

import React, { useState, useEffect } from 'react';
import { getSelectedRoute, getSelectedRouteId, getTopologyStatus, getEnhancedTopology, subscribe } from '../stores/godviewStore';
import { getMappings } from '../api/godviewClient';
import type { EnhancedRouteInfo } from '../api/godviewClient';
import type { EnhancedTopology } from '../lib/topology/edgeIntelligence';

interface RouteDetailsPanelProps {
  className?: string;
}

export const RouteDetailsPanel: React.FC<RouteDetailsPanelProps> = ({ className = '' }) => {
  const [selectedRoute, setSelectedRoute] = useState(() => getSelectedRoute());
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>(() => getSelectedRouteId());
  const [topologyStatus, setTopologyStatus] = useState(() => getTopologyStatus());
  const [enhanced, setEnhanced] = useState(() => getEnhancedTopology());
  const [routeMapping, setRouteMapping] = useState<EnhancedRouteInfo | null>(null);

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setSelectedRoute(getSelectedRoute());
      setSelectedRouteId(getSelectedRouteId());
      setTopologyStatus(getTopologyStatus());
      setEnhanced(getEnhancedTopology());
    });
    return unsubscribe;
  }, []);

  // Load route mapping details when route ID changes
  useEffect(() => {
    async function loadRouteMapping() {
      if (!selectedRouteId) {
        setRouteMapping(null);
        return;
      }
      try {
        const mappingsRes = await getMappings();
        if (mappingsRes.ok && mappingsRes.items) {
          const mapping = mappingsRes.items.find(r => r.id === selectedRouteId);
          setRouteMapping(mapping || null);
        }
      } catch (err) {
        console.error('[RouteDetailsPanel] Error loading route mapping:', err);
        setRouteMapping(null);
      }
    }
    loadRouteMapping();
  }, [selectedRouteId]);

  // Get edge intelligence if available
  const getRouteIntelligence = () => {
    if (!enhanced || !selectedRouteId) return null;
    return enhanced.edgeIntelligence.get(selectedRouteId) || null;
  };

  const edgeIntelligence = getRouteIntelligence();

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

  if (!selectedRoute || !selectedRouteId) {
    return (
      <div className={`rounded-lg border border-slate-800 bg-slate-950/50 p-12 text-center ${className}`}>
        <div className="max-w-md mx-auto space-y-3">
          <div className="text-sm font-semibold text-slate-200">
            No route selected
          </div>
          <div className="text-xs text-slate-400">
            Select a route to view details
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-slate-800 bg-slate-950/50 p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
          Route Details
        </div>
      </div>

      {/* Intent - Prominent */}
      <div>
        <div className="text-[10px] text-slate-500 uppercase mb-1">Intent</div>
        <div className="font-mono text-base text-cyan-300">{selectedRoute.intent || '—'}</div>
      </div>

      {/* Connection: Source → Target */}
      <div>
        <div className="text-[10px] text-slate-500 uppercase mb-1">Connection</div>
        <div className="text-sm text-slate-300">
          <span className="font-mono text-cyan-300">{selectedRoute.source || routeMapping?.source || '—'}</span>
          <span className="mx-2 text-slate-600">→</span>
          <span className="font-mono text-cyan-300">{selectedRoute.target || routeMapping?.target || routeMapping?.targetService || '—'}</span>
        </div>
      </div>

      {/* Source */}
      {(selectedRoute.source || routeMapping?.source) && (
        <div>
          <div className="text-[10px] text-slate-500 uppercase mb-1">Source</div>
          <div className="font-mono text-xs text-slate-400">{routeMapping?.source || selectedRoute.source || '—'}</div>
        </div>
      )}

      {/* Target Service */}
      {(selectedRoute.target || routeMapping?.targetService) && (
        <div>
          <div className="text-[10px] text-slate-500 uppercase mb-1">Target Service</div>
          <div className="font-mono text-xs text-slate-400">{routeMapping?.targetService || selectedRoute.target || routeMapping?.target || '—'}</div>
        </div>
      )}

      {/* Route ID */}
      <div>
        <div className="text-[10px] text-slate-500 uppercase mb-1">Route ID</div>
        <div className="font-mono text-xs text-slate-400 break-all">{selectedRoute.id || '—'}</div>
      </div>

      {/* Arc */}
      {selectedRoute.arc && (
        <div>
          <div className="text-[10px] text-slate-500 uppercase mb-1">Arc</div>
          <div className="text-xs text-slate-400">{selectedRoute.arc}</div>
        </div>
      )}

      {/* Layer */}
      {(selectedRoute.layer || routeMapping?.layer) && (
        <div>
          <div className="text-[10px] text-slate-500 uppercase mb-1">Layer</div>
          <div className="text-xs text-slate-400">{routeMapping?.layer || selectedRoute.layer || '—'}</div>
        </div>
      )}

      {/* Cluster */}
      {routeMapping?.cluster && (
        <div>
          <div className="text-[10px] text-slate-500 uppercase mb-1">Cluster</div>
          <div className="text-xs text-slate-400">{routeMapping.cluster}</div>
        </div>
      )}

      {/* Criticality */}
      {routeMapping?.criticality && (
        <div>
          <div className="text-[10px] text-slate-500 uppercase mb-1">Criticality</div>
          <div className="text-xs text-slate-400">{routeMapping.criticality}</div>
        </div>
      )}

      {/* Edge Intelligence - Health Status */}
      {edgeIntelligence && (
        <div>
          <div className="text-[10px] text-slate-500 uppercase mb-1">Health Status</div>
          <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-semibold border ${getStatusColor(edgeIntelligence.healthStatus)}`}>
            {edgeIntelligence.healthStatus.toUpperCase()}
          </span>
        </div>
      )}

      {/* Edge Intelligence - Confidence */}
      {edgeIntelligence && (
        <div>
          <div className="text-[10px] text-slate-500 uppercase mb-1">Confidence</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all"
                style={{ width: `${edgeIntelligence.confidenceScore * 100}%` }}
              />
            </div>
            <div className="text-xs text-slate-400 w-12 text-right">
              {(edgeIntelligence.confidenceScore * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      {/* Status */}
      {selectedRoute.status && (
        <div>
          <div className="text-[10px] text-slate-500 uppercase mb-1">Status</div>
          <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-semibold border ${getStatusColor(selectedRoute.status)}`}>
            {(selectedRoute.status || 'unknown').toUpperCase()}
          </span>
        </div>
      )}

      {/* Topology Status Warning Footer */}
      {topologyStatus !== 'LIVE' && (
        <div className="pt-3 mt-3 border-t border-slate-800">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
            <div className="text-[10px] text-amber-400 leading-relaxed">
              {topologyStatus === 'DEGRADED' || topologyStatus === 'BROKEN' 
                ? `Topology is ${topologyStatus.toLowerCase()} – details may be incomplete while Lifecycle is offline.`
                : 'Topology is partial – details may be incomplete while Lifecycle is offline.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

