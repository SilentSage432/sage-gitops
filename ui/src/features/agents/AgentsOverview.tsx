import React from 'react';

/**
 * AgentsOverview – Agents overview shell
 */
export const AgentsOverview: React.FC = () => {
  const mockAgents = [
    { id: 'a1', name: 'Agent Alpha', type: 'orchestrator', status: 'active', tasks: 5 },
    { id: 'a2', name: 'Agent Beta', type: 'monitor', status: 'active', tasks: 12 },
    { id: 'a3', name: 'Agent Gamma', type: 'coordinator', status: 'idle', tasks: 0 },
    { id: 'a4', name: 'Agent Delta', type: 'processor', status: 'active', tasks: 8 }
  ];

  const statusColor = (status: string) => {
    return status === 'active'
      ? 'bg-green-600/30 text-green-400'
      : 'bg-slate-700 text-slate-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">
          Agents Overview
        </h2>
        <p className="text-sm text-slate-400">
          Federation agent registry
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          Active Agents
        </h3>
        <div className="space-y-2">
          {mockAgents.map((agent) => (
            <div
              key={agent.id}
              className="p-4 bg-slate-900/50 rounded border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-cyan-400' : 'bg-slate-600'}`}></div>
                  <div>
                    <span className="text-slate-200 font-medium">
                      {agent.name}
                    </span>
                    <span className="ml-3 text-xs text-slate-500">
                      {agent.type}
                    </span>
                    <span className="ml-3 text-xs text-slate-500">
                      {agent.tasks} tasks
                    </span>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${statusColor(agent.status)}`}
                >
                  {agent.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

