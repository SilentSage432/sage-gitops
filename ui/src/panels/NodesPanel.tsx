import React from "react";

const NODES = [
  { name: "omega-core", status: "online" },
  { name: "rho2-sentinel", status: "online" },
  { name: "lambda-router", status: "degraded" },
  { name: "theta-gateway", status: "offline" },
];

const pillClassMap: Record<string, string> = {
  online: "bg-emerald-500/20 text-emerald-300",
  degraded: "bg-amber-500/20 text-amber-300",
  offline: "bg-red-500/20 text-red-300",
};

export default function NodesPanel() {
  return (
    <div className="p-6 space-y-4 text-sm text-slate-200">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Topology</p>
        <h2 className="text-2xl font-semibold text-white">Federation Nodes</h2>
        <p className="text-slate-400">Snapshot of operator-grade nodes and their current signal state.</p>
      </header>

      <div className="space-y-2">
        {NODES.map((node) => (
          <div
            key={node.name}
            className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-3"
          >
            <div>
              <p className="font-medium text-white">{node.name}</p>
              <p className="text-xs text-slate-400">Zone A / Prime Mesh</p>
            </div>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${pillClassMap[node.status]}`}>
              {node.status.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

