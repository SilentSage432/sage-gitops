import React from "react";

const AGENTS = [
  { name: "Whisperer-01", type: "Whisperer", state: "listening" },
  { name: "Sentry-Theta", type: "Guardian", state: "armed" },
  { name: "Muse-04", type: "Creative", state: "idle" },
];

export default function AgentsPanel() {
  return (
    <div className="p-6 space-y-4 text-sm text-slate-200">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Ops Center</p>
        <h2 className="text-2xl font-semibold text-white">Agents Overview</h2>
        <p className="text-slate-400">Current synthetic agents, their archetypes, and readiness states.</p>
      </header>

      <div className="overflow-hidden rounded-lg border border-white/5">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">State</th>
            </tr>
          </thead>
          <tbody>
            {AGENTS.map((agent) => (
              <tr key={agent.name} className="border-t border-white/5">
                <td className="px-4 py-3 font-medium text-white">{agent.name}</td>
                <td className="px-4 py-3">{agent.type}</td>
                <td className="px-4 py-3 capitalize text-slate-300">{agent.state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        disabled
        className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 cursor-not-allowed"
      >
        Spawn Agent (coming soon)
      </button>
    </div>
  );
}

