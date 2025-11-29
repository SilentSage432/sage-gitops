import React from "react";

interface SimulationDiffViewProps {
  diff?: any;
}

export function SimulationDiffView({ diff }: SimulationDiffViewProps) {
  if (!diff) return null;

  return (
    <div className="p-4 mt-4 border border-gray-700 rounded-md bg-black text-yellow-400">
      <h3 className="font-bold mb-2">Simulation Diff</h3>
      <pre className="text-xs overflow-auto">
        {JSON.stringify(diff, null, 2)}
      </pre>
    </div>
  );
}

