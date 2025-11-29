import React from "react";

interface SimulationViewProps {
  data: any;
}

/**
 * SimulationView - Passive display of orchestration simulation results
 * Read-only, no interaction, displays simulation output
 */
export const SimulationView: React.FC<SimulationViewProps> = ({ data }) => {
  if (!data) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">
          Simulated Orchestration
        </h3>
        <div className="space-y-2 text-xs text-slate-400">
          <pre className="overflow-auto max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

