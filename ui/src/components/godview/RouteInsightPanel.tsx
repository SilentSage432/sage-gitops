// 💡 Route Insight Panel Component
// Slide-out panel from the right showing detailed edge information

import React, { useState, useEffect } from 'react';
import { getSelectedEdgeId, getSelectedEdge, getTopologyStatus, getEnhancedTopology, clearSelectedEdge, subscribe } from '../../stores/godviewStore';
import { getMappings } from '../../api/godviewClient';
import type { EnhancedRouteInfo } from '../../api/godviewClient';
import { getLifecycleOk } from '../../stores/heartbeatStore';

interface RouteInsightPanelProps {
  className?: string;
}

export const RouteInsightPanel: React.FC<RouteInsightPanelProps> = ({ className = '' }) => {
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | undefined>(() => getSelectedEdgeId());
  const [selectedEdge, setSelectedEdge] = useState(() => getSelectedEdge());
  const [topologyStatus, setTopologyStatus] = useState(() => getTopologyStatus());
  const [enhanced, setEnhanced] = useState(() => getEnhancedTopology());
  const [routeMapping, setRouteMapping] = useState<EnhancedRouteInfo | null>(null);
  const [lifecycleReachable, setLifecycleReachable] = useState(() => getLifecycleOk() ?? false);

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setSelectedEdgeId(getSelectedEdgeId());
      setSelectedEdge(getSelectedEdge());
      setTopologyStatus(getTopologyStatus());
      setEnhanced(getEnhancedTopology());
      setLifecycleReachable(getLifecycleOk() ?? false);
    });
    return unsubscribe;
  }, []);

  // Load route mapping details when edge ID changes
  useEffect(() => {
    async function loadRouteMapping() {
      if (!selectedEdgeId) {
        setRouteMapping(null);
        return;
      }
      try {
        const mappingsRes = await getMappings();
        if (mappingsRes.ok && mappingsRes.items) {
          const mapping = mappingsRes.items.find(r => r.id === selectedEdgeId);
          setRouteMapping(mapping || null);
        }
      } catch (err) {
        console.error('[RouteInsightPanel] Error loading route mapping:', err);
        setRouteMapping(null);
      }
    }
    loadRouteMapping();
  }, [selectedEdgeId]);

  // Get edge intelligence
  const edgeIntelligence = selectedEdgeId && enhanced
    ? enhanced.edgeIntelligence.get(selectedEdgeId)
    : null;

  const isOpen = !!selectedEdgeId && !!selectedEdge;

  if (!isOpen) {
    return null;
  }

  const getStatusColor = (status: string | undefined) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'healthy':
      case 'live':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'degraded':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'broken':
      case 'offline':
      case 'unreachable':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Generate fake topology trace steps (placeholder for now)
  const generateTopologyTrace = () => {
    if (!selectedEdge) return [];
    const steps = [
      { step: 1, node: selectedEdge.source, action: 'Initiated', time: '0ms' },
      { step: 2, node: 'mesh-router', action: 'Routed', time: '+2ms' },
      { step: 3, node: selectedEdge.target, action: 'Received', time: '+5ms' },
    ];
    return steps;
  };

  const traceSteps = generateTopologyTrace();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={clearSelectedEdge}
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${className}`}
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
            Route Insights
          </div>
          <button
            onClick={clearSelectedEdge}
            className="text-slate-400 hover:text-slate-200 transition-colors text-xl leading-none"
            title="Close panel"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Intent - Prominent */}
          <div>
            <div className="text-[10px] text-slate-500 uppercase mb-1">Intent</div>
            <div className="font-mono text-base text-cyan-300">{selectedEdge.intent || '—'}</div>
          </div>

          {/* Connection */}
          <div>
            <div className="text-[10px] text-slate-500 uppercase mb-1">Connection</div>
            <div className="text-sm text-slate-300">
              <span className="font-mono text-cyan-300">{selectedEdge.source || routeMapping?.source || '—'}</span>
              <span className="mx-2 text-slate-600">→</span>
              <span className="font-mono text-cyan-300">{selectedEdge.target || routeMapping?.target || routeMapping?.targetService || '—'}</span>
            </div>
          </div>

          {/* Arc */}
          {selectedEdge.arc && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase mb-1">Arc</div>
              <div className="text-xs text-slate-400">{selectedEdge.arc}</div>
            </div>
          )}

          {/* Layer */}
          {(selectedEdge.layer || routeMapping?.layer) && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase mb-1">Layer</div>
              <div className="text-xs text-slate-400">{routeMapping?.layer || selectedEdge.layer || '—'}</div>
            </div>
          )}

          {/* Criticality */}
          {routeMapping?.criticality && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase mb-1">Criticality</div>
              <div className="text-xs text-slate-400">{routeMapping.criticality}</div>
            </div>
          )}

          {/* Lifecycle Status */}
          <div>
            <div className="text-[10px] text-slate-500 uppercase mb-1">Lifecycle Status</div>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: !lifecycleReachable
                    ? '#64748b' // gray
                    : topologyStatus === 'LIVE'
                    ? '#10b981' // green
                    : topologyStatus === 'DEGRADED'
                    ? '#f59e0b' // amber
                    : '#ef4444', // red
                  boxShadow: !lifecycleReachable
                    ? 'none'
                    : `0 0 6px ${
                        topologyStatus === 'LIVE'
                          ? '#10b98180'
                          : topologyStatus === 'DEGRADED'
                          ? '#f59e0b80'
                          : '#ef444480'
                      }`,
                  animation: lifecycleReachable && topologyStatus !== 'OFFLINE' ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
                }}
              />
              <span className="text-xs text-slate-300">
                {!lifecycleReachable
                  ? 'Unreachable'
                  : topologyStatus}
              </span>
            </div>
          </div>

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

          {/* Topology Trace Steps */}
          <div>
            <div className="text-[10px] text-slate-500 uppercase mb-2">Topology Trace</div>
            {!lifecycleReachable ? (
              <div className="text-xs text-slate-500 italic">
                Topology-only mode — trace data unavailable while lifecycle is unreachable
              </div>
            ) : (
              <div className="space-y-2">
                {traceSteps.map((step) => (
                  <div key={step.step} className="flex items-center gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-semibold text-slate-400 flex-shrink-0">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <div className="font-mono text-slate-300">{step.node}</div>
                      <div className="text-slate-500 text-[10px]">{step.action}</div>
                    </div>
                    <div className="text-slate-500 font-mono text-[10px]">{step.time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

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

          {/* Lifecycle Unreachable Warning */}
          {!lifecycleReachable && (
            <div className="pt-3 mt-3 border-t border-slate-800">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-500 mt-1 flex-shrink-0" />
                <div className="text-[10px] text-slate-400 leading-relaxed">
                  Lifecycle data is unreachable. Running in topology-only mode. Metrics and detailed traces are unavailable.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
