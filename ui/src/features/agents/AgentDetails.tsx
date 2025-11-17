import React from 'react';

/**
 * AgentDetails – Agent detail view shell
 */
export const AgentDetails: React.FC<{ agentId?: string }> = ({ agentId }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">
          Agent Details
        </h2>
        <p className="text-sm text-slate-400">
          Detailed agent information shell
        </p>
      </div>
      <div className="mt-8 p-6 bg-slate-900/50 rounded border border-slate-800">
        <p className="text-slate-500 text-sm">
          {agentId ? `Viewing agent: ${agentId}` : 'Select an agent to view details...'}
        </p>
      </div>
    </div>
  );
};

