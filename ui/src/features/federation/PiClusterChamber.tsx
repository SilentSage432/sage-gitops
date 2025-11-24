import React from "react";
import { Server, Plus, AlertCircle } from "lucide-react";
import { useMeshTelemetry } from "../../sage/telemetry/useMeshTelemetry";

export const PiClusterChamber = () => {
  // Static counts - all zero for empty state
  const offlineCount = 0;
  const pendingCount = 0;
  const readyCount = 0;

  const telemetry = useMeshTelemetry();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-bold tracking-wide text-purple-300 mb-2">
          Pi Kluster Chamber
        </h2>
        <p className="text-sm text-slate-400">
          Federated compute cluster — awaiting first node
        </p>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* THREE-TIER STATUS SHELL */}
          <div className="grid grid-cols-3 gap-4">
            {/* OFFLINE */}
            <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">OFFLINE</span>
                <span className="px-2 py-1 rounded text-xs font-medium text-slate-400 bg-slate-400/10">
                  {offlineCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                <span className="text-xs text-slate-500">No nodes offline</span>
              </div>
            </div>

            {/* PENDING */}
            <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-amber-400">PENDING</span>
                <span className="px-2 py-1 rounded text-xs font-medium text-amber-400 bg-amber-400/10">
                  {pendingCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                <span className="text-xs text-amber-500/70">Awaiting activation</span>
              </div>
            </div>

            {/* READY */}
            <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-emerald-400">READY</span>
                <span className="px-2 py-1 rounded text-xs font-medium text-emerald-400 bg-emerald-400/10">
                  {readyCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-emerald-500/70">Operational nodes</span>
              </div>
            </div>
          </div>

          {/* NODE LIST TABLE */}
          <div className="bg-slate-900/60 rounded-lg border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-slate-200">Node List</h3>
            </div>
            <div className="p-8 text-center">
              <Server className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-sm text-slate-400">No Pi nodes detected</p>
            </div>
          </div>

          {/* CAPACITY PANEL */}
          <div className="bg-slate-900/60 rounded-lg border border-slate-800 p-4">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Cluster Capacity</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-400">Total Nodes</p>
                <p className="text-2xl font-semibold text-slate-300">0</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-400">Available</p>
                <p className="text-2xl font-semibold text-slate-300">0</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-400">CPU Cores</p>
                <p className="text-2xl font-semibold text-slate-300">0</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-400">Memory</p>
                <p className="text-2xl font-semibold text-slate-300">0 GB</p>
              </div>
            </div>
          </div>

          {/* TELEMETRY BLOCK */}
          <div className="bg-slate-900/60 rounded-lg border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-200">Telemetry</h3>
              <AlertCircle className="w-4 h-4 text-slate-500" />
            </div>
            <div className="space-y-4 mt-6">
              {telemetry.slice(-5).map((pkt, i) => (
                <div key={i} className="p-4 bg-slate-900/60 rounded border border-slate-800">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>{pkt.node}</span>
                    <span>{new Date(pkt.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-lg text-purple-300 font-semibold">
                        {pkt.cpu.toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-500">CPU</p>
                    </div>
                    <div>
                      <p className="text-lg text-blue-300 font-semibold">
                        {pkt.memory.toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-500">Memory</p>
                    </div>
                    <div>
                      <p className="text-lg text-orange-300 font-semibold">
                        {pkt.temp.toFixed(1)}°C
                      </p>
                      <p className="text-xs text-slate-500">Temp</p>
                    </div>
                    <div>
                      <p className="text-lg text-green-300 font-semibold">
                        {pkt.latency.toFixed(1)}ms
                      </p>
                      <p className="text-xs text-slate-500">Latency</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ADD FIRST NODE BUTTON */}
          <div className="pt-2">
            <button
              className="w-full py-3 px-4 bg-purple-600/20 hover:bg-purple-600/30
              border border-purple-500/30 hover:border-purple-500/50
              rounded-lg text-purple-300 font-medium
              transition flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              <Plus className="w-4 h-4" />
              Add first node
            </button>
            <p className="text-xs text-slate-500 text-center mt-2">
              Node provisioning will be available once federation is initialized
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
