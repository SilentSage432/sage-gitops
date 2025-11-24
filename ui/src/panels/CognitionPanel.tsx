import React from "react";

const FEED_ENTRIES = [
  { id: 1, label: "Signal harmonized across Chi bus", time: "09:24:11" },
  { id: 2, label: "Theta predictive resonance stabilized", time: "09:22:03" },
  { id: 3, label: "Omega meaning layer updated reason codes", time: "09:18:42" },
];

const TABS = ["Raw", "Signal", "Hybrid"] as const;

export default function CognitionPanel() {
  return (
    <div className="p-6 space-y-5 text-sm text-slate-200">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Awareness Layer</p>
        <h2 className="text-2xl font-semibold text-white">Cognition Stream</h2>
        <p className="text-slate-400">Live consciousness markers and reasoning deltas entering the mesh.</p>
      </header>

      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            disabled
            className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs text-slate-400 cursor-not-allowed"
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="h-[60vh] rounded-lg border border-white/5 bg-black/30 p-4 overflow-y-auto space-y-3">
        {FEED_ENTRIES.map((entry) => (
          <div key={entry.id} className="rounded-md border border-white/5 bg-white/5 px-4 py-3 flex items-start gap-3">
            <span className="text-xs text-slate-500">{entry.time}</span>
            <p className="text-slate-200 flex-1">{entry.label}</p>
          </div>
        ))}
        <div className="text-xs text-slate-500 text-center pt-4">Streaming placeholder feed — live link pending.</div>
      </div>
    </div>
  );
}

