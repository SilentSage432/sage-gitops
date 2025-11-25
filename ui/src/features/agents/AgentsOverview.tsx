import React, { useState, useEffect } from 'react';
import { FederationAgentRegistry } from '../../sage/federation/kernel/FederationAgentRegistry';
import { federationKernelBus } from '../../sage/federation/kernel/FederationKernelBus';
import type { RegisteredAgent } from '../../sage/federation/kernel/FederationAgentRegistry';

/**
 * AgentsOverview – Agents overview shell
 */
export const AgentsOverview: React.FC = () => {
  const [agents, setAgents] = useState<RegisteredAgent[]>([]);

  useEffect(() => {
    // Initial load
    setAgents(FederationAgentRegistry.list());

    // Subscribe to federation events for auto-refresh
    const unsubscribe = federationKernelBus.onAny(() => {
      setAgents(FederationAgentRegistry.list());
    });

    return () => unsubscribe();
  }, []);

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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            Registered Agents
          </h3>
          <span className="text-xs text-slate-500">
            {agents.length} agent{agents.length !== 1 ? 's' : ''}
          </span>
        </div>
        {agents.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded border border-slate-800">
            <p className="text-sm text-slate-400">
              No agents registered yet. Create one using the Agent Genesis panel.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="p-4 bg-slate-900/50 rounded border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      agent.status === 'completed' || agent.status === 'active' 
                        ? 'bg-cyan-400' 
                        : agent.status === 'error' || agent.status === 'failed'
                        ? 'bg-red-400'
                        : 'bg-amber-400'
                    }`}></div>
                    <div>
                      <span className="text-slate-200 font-medium">
                        {agent.manifest?.name || agent.id}
                      </span>
                      <span className="ml-3 text-xs text-slate-500">
                        {agent.manifest?.class || 'unknown'}
                      </span>
                      {agent.manifest?.capabilities && (
                        <span className="ml-3 text-xs text-slate-500">
                          {agent.manifest.capabilities.length} capability{agent.manifest.capabilities.length !== 1 ? 'ies' : 'y'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${statusColor(agent.status)}`}
                    >
                      {agent.status}
                    </span>
                    <span className="text-xs text-slate-600 font-mono">
                      {new Date(agent.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

