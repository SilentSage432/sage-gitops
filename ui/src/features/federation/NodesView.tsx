import React, { useEffect, useState } from 'react';
import { getNodeHealth, NodeHealth } from '../../services/nodeService';

/**
 * NodesView – Basic nodes/pods shell
 */
export const NodesView: React.FC = () => {
  const [nodeHealth, setNodeHealth] = useState<NodeHealth | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await getNodeHealth();
      setNodeHealth(data);
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">
          Nodes View
        </h2>
        <p className="text-sm text-slate-400">
          Basic nodes/pods shell
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          Node Health
        </h3>
        {nodeHealth ? (
          <div className="p-4 bg-slate-900/50 rounded border border-slate-800 space-y-2 text-sm">
            <p className="text-slate-300">
              <span className="text-slate-500">Status:</span> {nodeHealth.status}
            </p>
            <p className="text-slate-300">
              <span className="text-slate-500">CPU:</span> {nodeHealth.cpu}%
            </p>
            <p className="text-slate-300">
              <span className="text-slate-500">Memory:</span> {nodeHealth.mem}%
            </p>
            <p className="text-slate-300">
              <span className="text-slate-500">Pods:</span> {nodeHealth.pods}
            </p>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Loading...</p>
        )}
      </div>
    </div>
  );
};

