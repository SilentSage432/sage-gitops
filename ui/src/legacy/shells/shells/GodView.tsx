import React, { useEffect, useState, useMemo } from 'react';
import { startGodviewStream, stopGodviewStream } from '../lib/streams/godviewStream';
import { getTopology, getTopologyStatus, getNormalizedTopology, getEnhancedTopology, fetchAndNormalizeTopology, subscribe as subscribeStore, getActiveArcs, isAllArcsActive, getSelectedNodeId, getSelectedRouteId, selectRoute, setSelectedNodeId, getFilteredNodes, getFilteredEdges } from '../stores/godviewStore';
import { getNodes, getMappings, type NodeInfo, type TopologyResponse, type EnhancedRouteInfo } from '../api/godviewClient';
import { getHeartbeat, getStatus as getHeartbeatStatus, getReason as getHeartbeatReason, getSignals, getDependencies, getKubeApiReachable, getLifecycleOk, subscribe as subscribeHeartbeat } from '../stores/heartbeatStore';
import { DependencyMatrix } from '../components/DependencyMatrix';
import { TopologyPulse } from '../components/TopologyPulse';
import { TopologyGraph } from '../components/TopologyGraph';
import { ArcFilterBar } from '../components/godview/ArcFilterBar';
import { TopologyDetailsPanel } from '../components/godview/TopologyDetailsPanel';
import { RouteDetailsPanel } from '../components/RouteDetailsPanel';
import { RouteInsightPanel } from '../components/godview/RouteInsightPanel';
import { TopologyNode } from '../components/godview/TopologyNode';

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return dateString;
  }
}

export const GodView: React.FC = () => {
  const [topo, setTopo] = useState<TopologyResponse | null>(null);
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [mappings, setMappings] = useState<EnhancedRouteInfo[]>([]);
  const [mappingsError, setMappingsError] = useState<string | null>(null);
  const [mappingsLoading, setMappingsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updateKey, setUpdateKey] = useState(0);
  const [heartbeat, setHeartbeat] = useState(() => getHeartbeat());
  const [heartbeatStatus, setHeartbeatStatus] = useState(() => getHeartbeatStatus());
  const [heartbeatReason, setHeartbeatReason] = useState(() => getHeartbeatReason());
  const [signals, setSignals] = useState(() => getSignals());
  const [dependencies, setDependencies] = useState(() => getDependencies());
  const [topologyStatus, setTopologyStatus] = useState<'LIVE' | 'DEGRADED' | 'BROKEN' | 'OFFLINE'>(() => getTopologyStatus());
  const [kubeApiReachable, setKubeApiReachable] = useState(() => getKubeApiReachable());
  const [lifecycleOk, setLifecycleOk] = useState(() => getLifecycleOk());
  const [activeArcs, setActiveArcs] = useState<string[]>(() => getActiveArcs());
  const [allArcsActive, setAllArcsActive] = useState<boolean>(() => isAllArcsActive());
  const [selectedNodeId, setSelectedNodeIdState] = useState<string | undefined>(() => getSelectedNodeId());
  const [selectedRouteId, setSelectedRouteIdState] = useState<string | undefined>(() => getSelectedRouteId());
  const normalized = getNormalizedTopology();
  const enhanced = getEnhancedTopology();
  const filteredNodes = getFilteredNodes();
  const filteredEdges = getFilteredEdges();

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = subscribeStore(() => {
      const storeTopology = getTopology();
      const storeNormalized = getNormalizedTopology();
      const storeStatus = getTopologyStatus();
      const storeActiveArcs = getActiveArcs();
      const storeAllArcsActive = isAllArcsActive();
      const storeSelectedNodeId = getSelectedNodeId();
      const storeSelectedRouteId = getSelectedRouteId();
      
      setTopologyStatus(storeStatus);
      setActiveArcs(storeActiveArcs);
      setAllArcsActive(storeAllArcsActive);
      setSelectedNodeIdState(storeSelectedNodeId);
      setSelectedRouteIdState(storeSelectedRouteId);
      
      if (storeTopology) {
        setTopo(storeTopology);
        setNodes(storeTopology.nodes || []);
        setError(null);
      }
      
      if (storeNormalized) {
        setNodes(storeNormalized.nodes || []);
      }
      
      setUpdateKey(prev => prev + 1);
    });

    return unsubscribe;
  }, []);

  // Subscribe to heartbeat changes
  useEffect(() => {
    const unsubscribe = subscribeHeartbeat(() => {
      setHeartbeat(getHeartbeat());
      setHeartbeatStatus(getHeartbeatStatus());
      setHeartbeatReason(getHeartbeatReason());
      setSignals(getSignals());
      setDependencies(getDependencies());
      setKubeApiReachable(getKubeApiReachable());
      setLifecycleOk(getLifecycleOk());
    });

    return unsubscribe;
  }, []);

  // Initial load and start stream
  useEffect(() => {
    async function initialLoad() {
      try {
        // Check if lifecycle is offline before fetching
        const deps = getDependencies();
        const kubeReachable = getKubeApiReachable();
        const lifecycleOkStatus = getLifecycleOk();
        const lifecycleOffline = deps?.kubeApi?.status === 'offline' || !kubeReachable || !lifecycleOkStatus;

        // Fetch and normalize topology from store
        await fetchAndNormalizeTopology();
        
        // Also fetch mappings directly for display
        // Use fallback edges if lifecycle is offline
        const { getMappings: fetchMappings } = await import('../api/godviewClient');
        const mappingsRes = await fetchMappings(lifecycleOffline);

        if (mappingsRes.ok && mappingsRes.items) {
          setMappings(mappingsRes.items || []);
        } else {
          setMappingsError(mappingsRes.error || 'Failed to load mappings');
        }

        // Load from store
        const storeTopology = getTopology();
        const storeNormalized = getNormalizedTopology();
        const storeStatus = getTopologyStatus();
        
        setTopologyStatus(storeStatus);
        
        if (storeTopology) {
          setTopo(storeTopology);
        }
        
        if (storeNormalized) {
          setNodes(storeNormalized.nodes || []);
        }
      } catch (e: any) {
        console.error('[GodView] Error loading data:', e);
        setError(e?.message || 'Failed to load data');
      } finally {
        setLoading(false);
        setMappingsLoading(false);
      }
    }

    initialLoad();
    startGodviewStream();

    return () => {
      stopGodviewStream();
    };
  }, []);

  // Load nodes separately if needed
  useEffect(() => {
    if (topo && (!nodes || nodes.length === 0)) {
      getNodes().then(res => {
        if (res.ok && res.items) {
          setNodes(res.items);
        } else if (topo.nodes) {
          setNodes(topo.nodes);
        }
      });
    }
  }, [topo, nodes]);

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'degraded':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'unreachable':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'sealed':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Collect all unique arcs from mappings (flat array format)
  const allArcs = useMemo(() => {
    if (!mappings || !Array.isArray(mappings)) return [];
    const arcSet = new Set<string>();
    mappings.forEach(route => {
      if (route?.arc) {
        arcSet.add(route.arc);
      }
    });
    return Array.from(arcSet).sort().map(arcName => ({
      id: `arc-${arcName.toLowerCase()}`,
      name: arcName,
      status: mappings.find(r => r.arc === arcName)?.status || 'unknown',
    }));
  }, [mappings]);

  // Get filtered routes based on active arcs
  const filteredRoutes = useMemo(() => {
    if (!mappings || !Array.isArray(mappings)) return [];
    
    if (allArcsActive || activeArcs.length === 0) {
      // "All" is active - return all routes
      return mappings;
    }
    
    // Filter routes matching any active arc
    return mappings.filter(route => route.arc && activeArcs.includes(route.arc));
  }, [mappings, allArcsActive, activeArcs]);

  // Check if lifecycle is offline/unreachable
  const isLifecycleOffline = dependencies?.kubeApi?.status === 'offline' || !kubeApiReachable || !lifecycleOk;
  const showLifecycleBanner = isLifecycleOffline || topologyStatus !== 'LIVE';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-100">GodView</h1>
              <TopologyPulse status={topologyStatus} />
            </div>
            <p className="text-xs text-slate-400">
              Live topology of the SAGE federation: mesh, cluster, arcs, and routes.
            </p>
          </div>
        </div>
      </div>

      {/* Lifecycle offline banner */}
      {showLifecycleBanner && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm p-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <div className="text-xs font-medium text-amber-300">
              Lifecycle offline — using partial topology
            </div>
          </div>
        </div>
      )}

      {/* Dependency Matrix */}
      <div className="flex items-center justify-between">
        <DependencyMatrix deps={dependencies} />
      </div>

      {/* Topology offline banner */}
      {topologyStatus === 'OFFLINE' && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 backdrop-blur-sm p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <div className="text-xs font-semibold text-red-300">
              Topology link offline
            </div>
          </div>
        </div>
      )}

      {/* Topology degraded warning */}
      {topologyStatus === 'DEGRADED' && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <div className="text-xs font-semibold text-amber-300">
              Topology degraded — inference active
            </div>
          </div>
        </div>
      )}

      {/* Topology broken banner */}
      {topologyStatus === 'BROKEN' && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/15 backdrop-blur-sm p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <div className="text-xs font-semibold text-red-300">
              Critical federation disconnect detected
            </div>
          </div>
        </div>
      )}

      {/* Federation Overview Section */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/70 backdrop-blur-sm p-4">
        <div className="text-xs font-semibold text-slate-100 mb-3">Federation Overview</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs opacity-60 mb-1">Mesh ID</div>
            <div className="font-mono text-cyan-300">{heartbeat?.meshId ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs opacity-60 mb-1">Cluster ID</div>
            <div className="font-mono text-cyan-300">{heartbeat?.clusterId ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs opacity-60 mb-1">Status</div>
            <div className={`font-semibold ${
              heartbeatStatus === 'HEALTHY' ? 'text-green-400' :
              heartbeatStatus === 'DEGRADED' || heartbeatStatus === 'WARNING' ? 'text-amber-400' :
              heartbeatStatus === 'UNREACHABLE' ? 'text-red-400' :
              'text-slate-400'
            }`}>
              {heartbeatStatus === 'HEALTHY' ? 'ALIVE' :
               heartbeatStatus === 'DEGRADED' || heartbeatStatus === 'WARNING' ? 'WARN' :
               heartbeatStatus === 'UNREACHABLE' ? 'UNREACHABLE' :
               'UNKNOWN'}
            </div>
          </div>
          <div>
            <div className="text-xs opacity-60 mb-1">Nodes</div>
            <div className="text-lg font-semibold">{heartbeat?.nodeCount ?? '—'}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3 pt-3 border-t border-slate-800">
          <div>
            <div className="text-xs opacity-60 mb-1">Pods</div>
            <div className="text-lg font-semibold">{heartbeat?.podCount ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs opacity-60 mb-1">Deployments</div>
            <div className="text-lg font-semibold">{heartbeat?.deployCount ?? '—'}</div>
          </div>
          {heartbeat?.latencyMs !== undefined && heartbeat?.latencyMs !== null && (
            <div>
              <div className="text-xs opacity-60 mb-1">Latency</div>
              <div className="font-mono text-xs">{heartbeat.latencyMs} ms</div>
            </div>
          )}
          {heartbeat?.driftMs !== undefined && heartbeat?.driftMs !== null && (
            <div>
              <div className="text-xs opacity-60 mb-1">Clock Drift</div>
              <div className="font-mono text-xs">{heartbeat.driftMs} ms</div>
            </div>
          )}
        </div>
      </div>

      {/* Arc Filter Bar */}
      <ArcFilterBar className="mb-4" />

      {/* Topology Section */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/70 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-slate-100">Topology</div>
          {!allArcsActive && activeArcs.length > 0 && (
            <div className="text-[10px] text-slate-400">
              Filtered by: <span className="text-cyan-300">{activeArcs.join(', ')}</span>
            </div>
          )}
        </div>
        
        {topologyStatus === 'OFFLINE' ? (
          /* Zero-state for offline topology */
          <div className="p-12 text-center border border-slate-800 bg-slate-950/50 rounded-lg">
            <div className="max-w-md mx-auto space-y-3">
              <div className="text-lg font-semibold text-slate-200">
                Topology link offline
              </div>
              <div className="text-sm text-slate-400">
                SAGE cannot retrieve topology data from the federation right now.
              </div>
              {error && (
                <div className="text-xs text-slate-500 mt-2">
                  {error}
                </div>
              )}
              <div className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-800">
                Once connectivity is restored, topology data will populate automatically.
              </div>
            </div>
          </div>
        ) : (
          /* Topology content when available */
          <div className="space-y-3">
            {filteredNodes && filteredNodes.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs text-slate-400">
                  Node count: <span className="text-slate-200 font-semibold">{filteredNodes.length}</span>
                  {!allArcsActive && activeArcs.length > 0 && filteredNodes.length < nodes.length && (
                    <span className="text-slate-500 ml-2">
                      (of {nodes.length} total)
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredNodes.map((node, idx) => {
                    const isSelected = selectedNodeId === node.name;
                    return (
                      <div
                        key={node.name || idx}
                        onClick={() => setSelectedNodeId(isSelected ? undefined : node.name)}
                        className={`transition-all ${
                          isSelected
                            ? 'ring-2 ring-cyan-500/50'
                            : ''
                        }`}
                      >
                        <TopologyNode node={node} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-slate-400">
                {!allArcsActive && activeArcs.length > 0 ? `No nodes found for arcs: ${activeArcs.join(', ')}` : 'No node data available'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Topology Details Panel */}
      {(selectedNodeId || selectedRouteId) && (
        <TopologyDetailsPanel />
      )}

      {/* Topology Graph Section */}
      {enhanced && enhanced.edgeIntelligence && enhanced.edgeIntelligence.size > 0 && (
        <TopologyGraph
          topology={enhanced}
          lifecycleStatus={topologyStatus}
          lifecycleReachable={lifecycleOk ?? false}
        />
      )}

      {/* Route Insight Panel - Slide-out from right */}
      <RouteInsightPanel />

      {/* Mappings Topology V2 - 3-Panel Layout */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/70 backdrop-blur-sm p-4">
        <div className="text-xs font-semibold text-slate-100 mb-4">Topology Map</div>
        {mappingsLoading ? (
          <div className="text-xs text-slate-500 text-center py-8">Loading topology…</div>
        ) : mappingsError ? (
          <div className="text-xs text-red-400 text-center py-8">{mappingsError}</div>
        ) : mappings && Array.isArray(mappings) && mappings.length > 0 ? (
          <div className="grid grid-cols-12 gap-4 min-h-[600px]">
            {/* Left Panel: Arc List */}
            <div className="col-span-12 md:col-span-3 space-y-2">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Arcs / Domains
              </div>
              <div className="space-y-1">
                  {allArcs.map((arc) => {
                  const isSelected = !allArcsActive && activeArcs.includes(arc.name);
                  const isDisabled = allArcsActive;
                  return (
                    <button
                      key={arc.id}
                      onClick={() => toggleArc(arc.name)}
                      disabled={isDisabled}
                      className={`w-full text-left p-2 rounded border transition-all ${
                        isSelected
                          ? 'border-cyan-500/50 bg-cyan-500/10'
                          : isDisabled
                          ? 'border-slate-800 bg-slate-950/50 opacity-50 cursor-not-allowed'
                          : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-950/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs font-semibold text-slate-200">{arc.name}</div>
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold border transition-opacity ${getStatusColor(arc.status)}`}>
                          {(arc.status || 'unknown').toUpperCase()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Center Panel: Topology Graph / Route Cards */}
            <div className="col-span-12 md:col-span-6 space-y-3">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Routes ({filteredRoutes.length})
                {!allArcsActive && activeArcs.length > 0 && (
                  <span className="text-slate-500 ml-2">
                    filtered by: {activeArcs.join(', ')}
                  </span>
                )}
              </div>
              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-2">
                {filteredRoutes.map((route) => {
                  if (!route || !route.id) return null; // Defensive: skip invalid routes
                  
                  const isSelected = selectedRouteId === route.id;
                  const routeStatus = route.status || 'unknown';
                  const routeTarget = route.target || route.targetService || 'unknown';
                  const routeCluster = route.cluster || 'unknown';
                  const routeIntent = route.intent || 'unknown';
                  const routeDescription = route.description || '';
                  const routeArc = route.arc || '';
                  
                  return (
                    <div
                      key={route.id}
                      onClick={() => selectRoute(isSelected ? null : route.id)}
                      className={`rounded border p-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-cyan-500/50 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                          : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-950/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-xs text-cyan-300 mb-1 truncate">
                            {routeIntent}
                          </div>
                          <div className="text-xs text-slate-300 mb-1 line-clamp-2">{routeDescription}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            <span className="font-mono text-slate-400">{routeTarget}</span>
                            <span className="mx-1 text-slate-600">·</span>
                            <span className="text-slate-600">{routeCluster}</span>
                            {routeArc && (
                              <>
                                <span className="mx-1 text-slate-600">·</span>
                                <span className="text-slate-600">{routeArc}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap transition-opacity ${getStatusColor(routeStatus)}`}>
                          {routeStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {filteredRoutes.length === 0 && (
                  <div className="text-xs text-slate-500 text-center py-8">
                    {mappingsLoading ? 'Loading routes…' : !allArcsActive && activeArcs.length > 0 ? `No routes found for arcs: ${activeArcs.join(', ')}` : 'No routes available'}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Route Details */}
            <div className="col-span-12 md:col-span-3">
              <RouteDetailsPanel />
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-12 text-center">
            <div className="max-w-md mx-auto space-y-3">
              <div className="text-sm font-semibold text-slate-200">
                GodView topology is still initializing
              </div>
              <div className="text-xs text-slate-400">
                The core federation arcs are online, but the topology map is in bootstrap mode.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Signals Snapshot Section */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/70 backdrop-blur-sm p-4">
        <div className="text-xs font-semibold text-slate-100 mb-3">Signals Snapshot</div>
        {signals ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <div className="text-slate-400 mb-1">Total Events (24h)</div>
              <div className="text-slate-200 font-mono text-sm">{signals.totalEvents24h ?? 0}</div>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Anomalies (24h)</div>
              <div className="text-slate-200 font-mono text-sm">{signals.anomalies24h ?? 0}</div>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Warnings Open</div>
              <div className={`font-mono text-sm ${(signals.warningOpen ?? 0) > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                {signals.warningOpen ?? 0}
              </div>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Critical Open</div>
              <div className={`font-mono text-sm ${(signals.criticalOpen ?? 0) > 0 ? 'text-red-400' : 'text-slate-200'}`}>
                {signals.criticalOpen ?? 0}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 text-center py-4">
            Signal data unavailable
          </div>
        )}
      </div>
    </div>
  );
};
