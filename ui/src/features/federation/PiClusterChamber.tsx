import React from 'react';

/**
 * PiClusterChamber – Pi Kluster constellation shell
 */
export const PiClusterChamber: React.FC = () => {
  const mockNodes = [
    { id: 'node-1', name: 'pi-node-alpha', status: 'healthy', pods: 12 },
    { id: 'node-2', name: 'pi-node-beta', status: 'healthy', pods: 8 },
    { id: 'node-3', name: 'pi-node-gamma', status: 'warning', pods: 6 },
    { id: 'node-4', name: 'pi-node-delta', status: 'healthy', pods: 10 }
  ];

  const statusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-600/30 text-green-400';
      case 'warning':
        return 'bg-yellow-600/30 text-yellow-400';
      case 'critical':
        return 'bg-red-600/30 text-red-400';
      default:
        return 'bg-slate-700 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">
          Pi Kluster Chamber
        </h2>
        <p className="text-sm text-slate-400">
          Pi Kluster constellation shell
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          Cluster Nodes
        </h3>
        <div className="space-y-2">
          {mockNodes.map((node) => (
            <div
              key={node.id}
              className="p-4 bg-slate-900/50 rounded border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <div>
                    <span className="text-slate-200 font-medium font-mono">
                      {node.name}
                    </span>
                    <span className="ml-3 text-xs text-slate-500">
                      {node.pods} pods
                    </span>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${statusColor(node.status)}`}
                >
                  {node.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

