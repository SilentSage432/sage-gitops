import React from "react";

interface SimulationPanelProps {
  simulation?: any;
}

export function SimulationPanel({ simulation }: SimulationPanelProps) {
  if (!simulation) return null;

  return (
    <div className="p-4 border border-gray-700 rounded-md bg-black text-green-400">
      <h3 className="font-bold mb-2">Simulation Result</h3>
      <pre className="text-xs overflow-auto">
        {JSON.stringify(simulation, null, 2)}
      </pre>
    </div>
  );
}

