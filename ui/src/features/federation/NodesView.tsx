import React from "react";
import { Server, Plus } from "lucide-react";

export const NodesView = () => {
  // Static counts - all zero for empty state
  const totalNodes = 0;
  const onlineCount = 0;
  const offlineCount = 0;
  const unknownCount = 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-bold tracking-wide text-purple-300 mb-2">
          Federation Nodes
        </h2>
        <p className="text-sm text-slate-400">
          All registered SAGE federation nodes
        </p>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* SUMMARY BAR */}
          <div className="grid grid-cols-4 gap-4">
            {/* TOTAL NODES */}
            <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Total Nodes</span>
                <span className="px-2 py-1 rounded text-xs font-medium text-slate-300 bg-slate-400/10">
                  {totalNodes}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                <span className="text-xs text-slate-500">No nodes registered</span>
              </div>
            </div>

            {/* ONLINE */}
            <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-emerald-400">Online</span>
                <span className="px-2 py-1 rounded text-xs font-medium text-emerald-400 bg-emerald-400/10">
                  {onlineCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-emerald-500/70">Operational nodes</span>
              </div>
            </div>

            {/* OFFLINE */}
            <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-red-400">Offline</span>
                <span className="px-2 py-1 rounded text-xs font-medium text-red-400 bg-red-400/10">
                  {offlineCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs text-red-500/70">Unreachable nodes</span>
              </div>
            </div>

            {/* UNKNOWN */}
            <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-amber-400">Unknown</span>
                <span className="px-2 py-1 rounded text-xs font-medium text-amber-400 bg-amber-400/10">
                  {unknownCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                <span className="text-xs text-amber-500/70">Status unknown</span>
              </div>
            </div>
          </div>

          {/* NODE LIST TABLE */}
          <div className="bg-slate-900/60 rounded-lg border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-slate-200">Node List</h3>
            </div>
            <div className="overflow-x-auto">
              {/* TABLE HEADER */}
              <div className="grid grid-cols-5 gap-4 p-4 border-b border-slate-800/50 bg-slate-900/40">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Name
                </div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Status
                </div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Role
                </div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Uptime
                </div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Last Sync
                </div>
              </div>
              {/* EMPTY STATE */}
              <div className="p-8 text-center">
                <Server className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-sm text-slate-400">No federation nodes detected</p>
              </div>
            </div>
          </div>

          {/* REGISTER NODE BUTTON */}
          <div className="pt-2">
            <button
              className="w-full py-3 px-4 bg-purple-600/20 hover:bg-purple-600/30
              border border-purple-500/30 hover:border-purple-500/50
              rounded-lg text-purple-300 font-medium
              transition flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
              title="Available when federation goes online"
            >
              <Plus className="w-4 h-4" />
              Register Node
            </button>
            <p className="text-xs text-slate-500 text-center mt-2">
              Available when federation goes online
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
