import React, { useState } from "react";
import { Globe } from "lucide-react";

const mockFederationNodes = [
  {
    id: "sage-prime",
    location: "Local Core",
    status: "ONLINE",
  },
  {
    id: "oracle-east",
    location: "Future Region",
    status: "PENDING",
  },
  {
    id: "specter-north",
    location: "Reserved",
    status: "OFFLINE",
  },
];

const statusColors = {
  ONLINE: "text-green-400 bg-green-400/10",
  PENDING: "text-yellow-400 bg-yellow-400/10",
  OFFLINE: "text-red-400 bg-red-400/10",
};

export const NodesView = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const active = mockFederationNodes.find((n) => n.id === selected);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-purple-300">Federation Nodes</h2>
      <p className="text-sm text-slate-400">Awaiting multi-region federation expansion.</p>
      <div className="space-y-3">
        {mockFederationNodes.map((node) => (
          <button
            key={node.id}
            onClick={() => setSelected(node.id)}
            className="w-full p-4 bg-slate-900/60 rounded-xl border border-slate-800
            hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/10
            transition flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-300" />
              <span className="text-slate-200 font-medium">{node.id}</span>
            </div>
            <span className={`px-2 py-1 rounded text-xs ${statusColors[node.status]}`}>
              {node.status}
            </span>
          </button>
        ))}
      </div>
      {active && (
        <div className="fixed right-0 top-0 bottom-0 w-96 bg-[#0b0b12]/95 backdrop-blur-xl
        border-l border-slate-800 shadow-2xl p-6 animate-in fade-in duration-300 overflow-y-auto">
          <h3 className="text-xl font-semibold text-purple-300 mb-4">
            {active.id}
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/60 rounded border border-slate-800">
              <p className="text-sm text-slate-400">Location</p>
              <p className="text-slate-200">{active.location}</p>
            </div>
          </div>
          <button
            onClick={() => setSelected(null)}
            className="mt-8 w-full py-2 rounded-md bg-slate-800 hover:bg-slate-700
            border border-slate-700 text-slate-300 transition"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};
