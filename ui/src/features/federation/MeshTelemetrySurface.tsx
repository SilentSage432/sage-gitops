import React from "react";
import { Radio, Activity, Server, BarChart3 } from "lucide-react";

export const MeshTelemetrySurface = () => {
  return (
    <div className="h-full flex flex-col overflow-hidden w-full">
      {/* HEADER */}
      <div className="p-6 border-b border-slate-800 flex-shrink-0">
        <h2 className="text-2xl font-bold tracking-wide text-purple-300 mb-2">
          Mesh Telemetry Surface
        </h2>
        <p className="text-sm text-slate-400">
          Live signal streams — awaiting federation activation
        </p>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="p-6 space-y-6 min-w-0">
          {/* PRIMARY STREAM WINDOW */}
          <div className="bg-black/20 border border-slate-800 rounded-lg min-w-0 overflow-hidden" style={{ height: '260px' }}>
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Radio className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-sm text-slate-400">No telemetry detected</p>
              </div>
            </div>
          </div>

          {/* METRICS ROW */}
          <div className="grid grid-cols-3 gap-4 min-w-0">
            {/* SIGNAL THROUGHPUT */}
            <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-sm text-slate-400 truncate">Signal Throughput</span>
              </div>
              <div className="text-2xl font-semibold text-slate-300">— kbps</div>
            </div>

            {/* STREAM INTEGRITY */}
            <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <Radio className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-sm text-slate-400 truncate">Stream Integrity</span>
              </div>
              <div className="text-sm text-slate-500">No signal</div>
            </div>

            {/* ACTIVE NODES */}
            <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-sm text-slate-400 truncate">Active Nodes</span>
              </div>
              <div className="text-2xl font-semibold text-slate-300">0</div>
            </div>
          </div>

          {/* FUTURE CHART PLACEHOLDER */}
          <div className="bg-slate-900/60 rounded-lg border border-slate-800 p-6 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-slate-500 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-slate-200 truncate">Visualizations</h3>
            </div>
            <div className="p-8 text-center border-2 border-dashed border-slate-700/50 rounded-lg min-w-0 overflow-hidden">
              <p className="text-sm text-slate-400 break-words">
                Visualization will appear when streams initialize
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

