import React from "react";

interface CapabilityGraphProps {
  graph?: Array<{
    agent: string;
    role: string;
    capabilities: string[];
    status: string;
  }>;
}

export function CapabilityGraph({ graph }: CapabilityGraphProps) {
  if (!graph) return null;

  return (
    <div className="p-4 border border-cyan-600 rounded bg-black text-cyan-400">
      <h3 className="font-bold mb-2">Federation Capability Graph</h3>
      <pre className="text-xs overflow-auto">
        {JSON.stringify(graph, null, 2)}
      </pre>
    </div>
  );
}

