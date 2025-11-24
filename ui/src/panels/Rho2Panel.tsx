import React from "react";

const MOCK_SHARDS = [
  { id: "rho2-a", status: "online", quorum: "primary" },
  { id: "rho2-b", status: "online", quorum: "secondary" },
  { id: "rho2-c", status: "degraded", quorum: "observer" },
];

const statusColorMap: Record<string, string> = {
  online: "text-emerald-400",
  degraded: "text-amber-400",
  offline: "text-red-400",
};

export default function Rho2Panel() {
  return (
    <div className="p-6 space-y-6 text-sm text-slate-200">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Prime Console</p>
        <h2 className="text-2xl font-semibold text-white">Rho² Command Console</h2>
        <p className="text-slate-400">
          Shard health, quorum alignment, and seal controls for the Rho² enforcement mesh.
        </p>
      </header>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-white/90">Shard Status</h3>
        <div className="space-y-2">
          {MOCK_SHARDS.map((shard) => (
            <div
              key={shard.id}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-3"
            >
              <div>
                <p className="font-medium text-white">{shard.id.toUpperCase()}</p>
                <p className="text-xs text-slate-400">Quorum: {shard.quorum}</p>
              </div>
              <span className={`text-xs font-semibold ${statusColorMap[shard.status] ?? "text-slate-400"}`}>
                {shard.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-white/90">Quorum Indicator</h3>
        <div className="rounded-md border border-purple-500/30 bg-purple-500/5 px-4 py-3 text-purple-100">
          Majority quorum locked (5 / 7 signatures). Awaiting seal authority.
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-white/90">Seal Actions</h3>
        <div className="flex gap-3">
          <button
            disabled
            className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 cursor-not-allowed"
          >
            Request Seal (coming soon)
          </button>
          <button
            disabled
            className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 cursor-not-allowed"
          >
            Request Unseal (coming soon)
          </button>
        </div>
      </section>
    </div>
  );
}

