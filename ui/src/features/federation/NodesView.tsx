import React from 'react';

/**
 * NodesView – Basic nodes/pods shell
 */
export const NodesView: React.FC = () => {
  const mockNodes = [
    { id: 'n1', name: 'node-001', type: 'control-plane', status: 'ready', cpu: '45%', memory: '62%' },
    { id: 'n2', name: 'node-002', type: 'worker', status: 'ready', cpu: '32%', memory: '48%' },
    { id: 'n3', name: 'node-003', type: 'worker', status: 'ready', cpu: '28%', memory: '55%' },
    { id: 'n4', name: 'node-004', type: 'worker', status: 'not-ready', cpu: '0%', memory: '0%' }
  ];

  const statusColor = (status: string) => {
    return status === 'ready'
      ? 'bg-green-600/30 text-green-400'
      : 'bg-red-600/30 text-red-400';
  };

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
          Federation Nodes
        </h3>
        <div className="space-y-2">
          {mockNodes.map((node) => (
            <div
              key={node.id}
              className="p-4 bg-slate-900/50 rounded border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${node.status === 'ready' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <div>
                    <span className="text-slate-200 font-medium font-mono">
                      {node.name}
                    </span>
                    <span className="ml-3 text-xs text-slate-500">
                      {node.type}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${statusColor(node.status)}`}
                >
                  {node.status}
                </span>
              </div>
              <div className="flex gap-4 text-xs text-slate-500">
                <span>CPU: <span className="text-slate-300">{node.cpu}</span></span>
                <span>Memory: <span className="text-slate-300">{node.memory}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

