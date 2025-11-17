// 🔌 Federation Dependencies
// Shows honest status of Kube API, Topology, and Lifecycle dependencies

import React, { useEffect, useState } from 'react';
import { getHeartbeat, getKubeApiReachable, getLifecycleOk, getTopologyOk, subscribe } from '../stores/heartbeatStore';

export const FederationDependencies: React.FC = () => {
  const [kubeApiReachable, setKubeApiReachable] = useState(() => getKubeApiReachable());
  const [lifecycleOk, setLifecycleOk] = useState(() => getLifecycleOk());
  const [topologyOk, setTopologyOk] = useState(() => getTopologyOk());

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setKubeApiReachable(getKubeApiReachable());
      setLifecycleOk(getLifecycleOk());
      setTopologyOk(getTopologyOk());
    });

    return unsubscribe;
  }, []);

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {/* Kube API Badge */}
      {kubeApiReachable === false ? (
        <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30">
          Kube API: unreachable (Talos networking arc pending)
        </span>
      ) : kubeApiReachable === true ? (
        <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">
          Kube API: reachable
        </span>
      ) : (
        <span className="px-2 py-1 rounded bg-gray-500/20 text-gray-400 border border-gray-500/30">
          Kube API: unknown
        </span>
      )}

      {/* Topology Badge */}
      {topologyOk === true ? (
        <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">
          Topology: OK
        </span>
      ) : topologyOk === false ? (
        <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
          Topology: unavailable
        </span>
      ) : (
        <span className="px-2 py-1 rounded bg-gray-500/20 text-gray-400 border border-gray-500/30">
          Topology: unknown
        </span>
      )}

      {/* Lifecycle Badge */}
      {lifecycleOk === true ? (
        <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">
          Lifecycle: OK
        </span>
      ) : lifecycleOk === false ? (
        <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
          Lifecycle: degraded (pod/deploy listings unavailable)
        </span>
      ) : (
        <span className="px-2 py-1 rounded bg-gray-500/20 text-gray-400 border border-gray-500/30">
          Lifecycle: unknown
        </span>
      )}
    </div>
  );
};

