import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/card';
import { startGodviewStream, stopGodviewStream } from '../lib/streams/godviewStream';
import { getPods as getStorePods, getDeployments as getStoreDeployments, getLastUpdated, getLifecycleSummary, getStatus as getLifecycleStatus, getStatusReason, setStatus, subscribe as subscribeStore } from '../stores/lifecycleStore';
import { getKubeApiReachable, getLifecycleOk, getDependencies, subscribe as subscribeHeartbeat } from '../stores/heartbeatStore';
import { getPods, getDeployments, type K8sPod, type K8sDeployment, type LifecycleStatus } from '../api/lifecycleClient';
import { getPodDetails } from '../services/lifecycleService';
import { DependencyMatrix } from '../components/DependencyMatrix';
import { cn } from '../utils/cn';

export function AgentLifecycle() {
  const [pods, setPods] = useState<K8sPod[]>([]);
  const [deploys, setDeploys] = useState<K8sDeployment[]>([]);
  const [sel, setSel] = useState<{ ns: string; name: string } | null>(null);
  const [selData, setSelData] = useState<any>(null);
  const [namespace, setNamespace] = useState<string>('all');
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [lifecycleStatus, setLifecycleStatus] = useState<LifecycleStatus>(() => getLifecycleStatus());
  const [lifecycleReason, setLifecycleReason] = useState<string | null>(() => getStatusReason());
  const [kubeApiReachable, setKubeApiReachable] = useState(() => getKubeApiReachable());
  const [lifecycleOk, setLifecycleOk] = useState(() => getLifecycleOk());
  const [dependencies, setDependencies] = useState(() => getDependencies());

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = subscribeStore(() => {
      const storePods = getStorePods();
      const storeDeployments = getStoreDeployments();
      const storeUpdated = getLastUpdated();
      const storeStatus = getLifecycleStatus();
      const storeReason = getStatusReason();
      
      setLifecycleStatus(storeStatus);
      setLifecycleReason(storeReason);
      
      if (storePods.length > 0 || storeDeployments.length > 0) {
        setPods(storePods);
        setDeploys(storeDeployments);
        setNamespace('all'); // Stream always uses ns=all
        setUpdatedAt(storeUpdated);
      }
    });

    return unsubscribe;
  }, []);

  // Subscribe to heartbeat for API reachability
  useEffect(() => {
    const unsubscribe = subscribeHeartbeat(() => {
      setKubeApiReachable(getKubeApiReachable());
      setLifecycleOk(getLifecycleOk());
      setDependencies(getDependencies());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Initial load and start stream
  useEffect(() => {
    async function initialLoad() {
      // Set loading state
      setStatus('loading', null);
      setLifecycleStatus('loading');

      try {
        const [podsRes, deploysRes] = await Promise.all([
          getPods('all'),
          getDeployments('all'),
        ]);

        // Determine overall status from both responses
        // If either is unreachable or both fail, we're unreachable
        // If both are ready, we're ready
        // Otherwise loading
        let overallStatus: LifecycleStatus = 'loading';
        let overallReason: string | null = null;

        if (podsRes.status === 'unreachable' || deploysRes.status === 'unreachable') {
          overallStatus = 'unreachable';
          overallReason = podsRes.reason || deploysRes.reason || null;
        } else if (podsRes.status === 'ready' || deploysRes.status === 'ready') {
          overallStatus = 'ready';
        } else {
          overallStatus = 'loading';
        }

        // Check heartbeat store for additional context
        const deps = getDependencies();
        if (deps.kubeApi.status === 'offline' || !getKubeApiReachable() || !getLifecycleOk()) {
          overallStatus = 'unreachable';
          overallReason = deps.kubeApi.reason || overallReason || 'K8s API unreachable from arc-ui';
        }

        setStatus(overallStatus, overallReason);
        setLifecycleStatus(overallStatus);
        setLifecycleReason(overallReason);

        if (podsRes.ok && podsRes.items) {
          setPods(podsRes.items);
          if (podsRes.data) {
            setNamespace(podsRes.data.namespace);
            setUpdatedAt(podsRes.data.updatedAt);
          }
        } else {
          setPods([]);
        }

        if (deploysRes.ok && deploysRes.items) {
          setDeploys(deploysRes.items);
          if (deploysRes.data) {
            const deploysUpdated = deploysRes.data.updatedAt;
            if (deploysUpdated && (!updatedAt || new Date(deploysUpdated) > new Date(updatedAt))) {
              setUpdatedAt(deploysUpdated);
            }
          }
        } else {
          setDeploys([]);
        }
      } catch (err: any) {
        // Map to unreachable if it's a network error
        const errorMsg = err?.message || '';
        if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('timeout')) {
          setStatus('unreachable', 'Deep lifecycle introspection is gated by Talos network isolation on the core SAGE node.');
          setLifecycleStatus('unreachable');
          setLifecycleReason('Deep lifecycle introspection is gated by Talos network isolation on the core SAGE node.');
        } else {
          setStatus('unreachable', 'Unable to load lifecycle data');
          setLifecycleStatus('unreachable');
          setLifecycleReason('Unable to load lifecycle data');
        }
      }
    }

    initialLoad();
    startGodviewStream(); // Stream handles real-time updates

    return () => {
      stopGodviewStream();
    };
  }, []);

  useEffect(() => {
    if (!sel) return;
    getPodDetails(sel.ns, sel.name).then(setSelData).catch(() => setSelData(null));
  }, [sel?.ns, sel?.name]);

  const byPhase = useMemo(() => {
    const a: Record<string, number> = {};
    for (const p of pods) {
      const phase = p.status?.phase || 'Unknown';
      a[phase] = (a[phase] || 0) + 1;
    }
    return a;
  }, [pods]);

  const totalPods = pods.length;
  const totalDeployments = deploys.length;
  const lifecycleSummary = getLifecycleSummary();

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const kubeApiStatus = dependencies?.kubeApi?.status ?? 'unknown';
  
  // Use lifecycleStatus from store, but also check heartbeat for consistency
  const effectiveStatus = lifecycleStatus === 'loading' 
    ? (kubeApiStatus === 'offline' || !kubeApiReachable || !lifecycleOk ? 'unreachable' : lifecycleStatus)
    : lifecycleStatus;

  return (
    <div className="space-y-4">
      {/* Header with status chip */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Lifecycle</h1>
          <p className="text-xs text-slate-400">
            Pod and deployment introspection for the SAGE federation
          </p>
        </div>
        {effectiveStatus !== 'loading' && (
          <span className={`px-2 py-1 rounded-full text-[10px] font-semibold border transition-opacity ${
            effectiveStatus === 'ready'
              ? 'bg-green-500/20 text-green-400 border-green-500/30'
              : effectiveStatus === 'unreachable'
              ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
              : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
          }`}>
            {effectiveStatus === 'ready' ? 'READY' : effectiveStatus === 'unreachable' ? 'ISOLATION SHIELD ACTIVE' : 'LOADING'}
          </span>
        )}
      </div>

      {/* Dependency Matrix */}
      <div className="flex items-center justify-between">
        <DependencyMatrix deps={dependencies} />
      </div>

      {/* Loading State - Skeleton Loader */}
      {effectiveStatus === 'loading' && (
        <div className="space-y-4">
          <Card className="p-4 border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-4 h-4 border-2 border-slate-600 border-t-cyan-400 rounded-full animate-spin" />
              <div className="text-xs font-medium text-slate-300">Linking to Federation telemetry…</div>
            </div>
            {/* Skeleton cards */}
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-800/50 rounded border border-slate-800 animate-pulse" />
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Unreachable State - Isolation Shield */}
      {effectiveStatus === 'unreachable' && (
        <Card className="p-12 text-center border-purple-500/30 bg-purple-500/5 backdrop-blur-sm">
          <div className="max-w-lg mx-auto space-y-4">
            <div className="flex items-center justify-center mb-2">
              <div className="w-20 h-20 rounded-full border-2 border-purple-500/30 bg-purple-500/10 flex items-center justify-center">
                <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 mb-2">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                  Isolation Shield Active
                </span>
              </div>
              <div className="text-base font-semibold text-slate-200">
                Deep lifecycle introspection is gated by Talos network isolation on the core SAGE node.
              </div>
              <div className="text-sm text-slate-300 leading-relaxed">
                {lifecycleReason || 'The UI and API wiring are ready; full pod/deployment visibility will unlock once a dedicated telemetry cluster (e.g. Pi cluster) is allowed to introspect the federation.'}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Ready State - Show tables/data */}
      {effectiveStatus === 'ready' && (
        <>
          <Card className="p-3">
            <div className="text-xs opacity-70 mb-2">Lifecycle Summary</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-xs opacity-60">Namespace</div>
                <div className="font-mono text-cyan-300">{namespace}</div>
              </div>
              <div>
                <div className="text-xs opacity-60">Total Pods</div>
                <div className="text-lg font-semibold">{totalPods}</div>
              </div>
              <div>
                <div className="text-xs opacity-60">Total Deployments</div>
                <div className="text-lg font-semibold">{totalDeployments}</div>
              </div>
              <div>
                <div className="text-xs opacity-60">Updated</div>
                <div className="text-xs font-mono">{formatDate(updatedAt)}</div>
              </div>
            </div>
          </Card>

          {/* Lifecycle Summary Strip */}
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div>
                Pods: <span className="text-slate-100">{lifecycleSummary.podCount}</span> ·
                Deployments: <span className="text-slate-100">{lifecycleSummary.deployCount}</span>
              </div>
              {lifecycleSummary.lastUpdated && (
                <div>Updated {new Date(lifecycleSummary.lastUpdated).toLocaleTimeString()}</div>
              )}
            </div>
            {lifecycleSummary.status === 'DEGRADED' && (
              <div className="text-xs text-amber-400">
                Lifecycle degraded – some pods not running. Check pod details below.
              </div>
            )}
          </div>

          {/* Empty state (only show if ready but no data) */}
          {totalPods === 0 && totalDeployments === 0 && (
            <Card className="p-4 text-center">
              <div className="text-sm text-slate-400">
                No resources detected. Waiting for cluster data…
              </div>
            </Card>
          )}

          {/* Detailed views */}
          {(totalPods > 0 || totalDeployments > 0) && (
            <>
              {/* Phase breakdown */}
              <Card className="p-3">
                <div className="text-xs opacity-70 mb-2">Phase breakdown</div>
                <div className="flex gap-3 text-sm">
                  {Object.entries(byPhase).map(([k, v]) => (
                    <span key={k} className="font-mono">{k}:{' '}{v}</span>
                  ))}
                </div>
              </Card>

              {/* Pods table */}
              <Card className="p-0 overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left px-3 py-2">Name</th>
                      <th className="text-left px-3 py-2">NS</th>
                      <th className="text-left px-3 py-2">Phase</th>
                      <th className="text-left px-3 py-2">Ready</th>
                      <th className="text-left px-3 py-2">Restarts</th>
                      <th className="text-left px-3 py-2">Node</th>
                      <th className="text-left px-3 py-2">Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pods.map(p => {
                      const meta = p.metadata || {};
                      const status = p.status || {};
                      const containers = status.containerStatuses || [];
                      const ready = containers.length > 0 && containers.every(c => c.ready);
                      const restarts = containers.reduce((sum, c) => sum + (c.restartCount || 0), 0);
                      
                      return (
                        <tr 
                          key={`${meta.namespace}/${meta.name}`} 
                          className="border-t border-white/5 hover:bg-white/5 cursor-pointer"
                          onClick={() => setSel({ ns: meta.namespace || '', name: meta.name || '' })}
                        >
                          <td className="px-3 py-2 font-mono">{meta.name || '—'}</td>
                          <td className="px-3 py-2">{meta.namespace || '—'}</td>
                          <td className="px-3 py-2">{status.phase || 'Unknown'}</td>
                          <td className="px-3 py-2">
                            <span className={cn('px-1 rounded', ready ? 'bg-emerald-500/20' : 'bg-yellow-500/20')}>
                              {ready ? 'ready' : 'not-ready'}
                            </span>
                          </td>
                          <td className="px-3 py-2">{restarts}</td>
                          <td className="px-3 py-2">{status.hostIP || '—'}</td>
                          <td className="px-3 py-2">—</td>
                        </tr>
                      );
                    })}
                    {pods.length === 0 && (
                      <tr><td colSpan={7} className="px-3 py-6 text-center opacity-70">No pods in {namespace}</td></tr>
                    )}
                  </tbody>
                </table>
              </Card>

              {/* Deployments table */}
              {totalDeployments > 0 && (
                <Card className="p-0 overflow-auto">
                  <div className="p-3 border-b border-white/5">
                    <div className="text-sm font-semibold">Deployments</div>
                  </div>
                  <table className="min-w-full text-sm">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="text-left px-3 py-2">Name</th>
                        <th className="text-left px-3 py-2">NS</th>
                        <th className="text-left px-3 py-2">Replicas</th>
                        <th className="text-left px-3 py-2">Ready</th>
                        <th className="text-left px-3 py-2">Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deploys.map(d => {
                        const meta = d.metadata || {};
                        const status = d.status || {};
                        const spec = d.spec || {};
                        
                        return (
                          <tr 
                            key={`${meta.namespace}/${meta.name}`} 
                            className="border-t border-white/5 hover:bg-white/5"
                          >
                            <td className="px-3 py-2 font-mono">{meta.name || '—'}</td>
                            <td className="px-3 py-2">{meta.namespace || '—'}</td>
                            <td className="px-3 py-2">{spec.replicas || 0}</td>
                            <td className="px-3 py-2">{status.readyReplicas || 0}</td>
                            <td className="px-3 py-2">{status.availableReplicas || 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {/* Drawer (simple inline) */}
      {sel && (
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="font-mono text-sm">{sel.ns}/{sel.name}</div>
            <button className="text-xs opacity-70 hover:opacity-100 underline" onClick={() => { setSel(null); setSelData(null); }}>
              close
            </button>
          </div>
          {!selData && <div className="text-xs opacity-60 mt-2">Loading…</div>}
          {selData && (
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <Card className="p-2">
                <div className="text-xs opacity-70 mb-1">Spec</div>
                <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(selData.pod, null, 2)}</pre>
              </Card>
              <Card className="p-2">
                <div className="text-xs opacity-70 mb-1">Logs (tail 200)</div>
                <pre className="text-xs overflow-auto max-h-64">
{Object.entries(selData.logs || {}).map(([k,v]) => `--- ${k} ---\n${v}\n`).join('\n')}
                </pre>
              </Card>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
