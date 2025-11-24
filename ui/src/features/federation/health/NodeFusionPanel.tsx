import React from "react";
import { X } from "lucide-react";
import { useNodeFusionTelemetry } from "./useNodeFusionTelemetry";

interface NodeFusionPanelProps {
  nodeId: string;
  onClose: () => void;
}

export const NodeFusionPanel: React.FC<NodeFusionPanelProps> = ({ nodeId, onClose }) => {
  const metrics = useNodeFusionTelemetry(nodeId);

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Backdrop - click to close */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="absolute right-0 top-0 bottom-0 w-[420px] bg-slate-900/95 backdrop-blur-md border-l border-slate-800 shadow-[0_0_32px_rgba(0,0,0,0.5)] pointer-events-auto transform transition-transform duration-300 ease-out"
        style={{
          boxShadow: "0 0 32px rgba(168, 85, 247, 0.2), inset 0 0 1px rgba(255, 255, 255, 0.1)",
          animation: "slideInRight 0.3s ease-out",
        }}
      >
        <style>
          {`
            @keyframes slideInRight {
              from {
                transform: translateX(100%);
              }
              to {
                transform: translateX(0);
              }
            }
          `}
        </style>
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-purple-300">Node Metrics</h3>
            <p className="text-xs text-slate-400 font-mono mt-1">{nodeId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800/60 rounded transition"
            title="Close"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto h-[calc(100vh-80px)]">
          <div className="p-6 space-y-4">
            {metrics ? (
              <>
                {/* CPU */}
                <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500">CPU Usage</span>
                    <span className="text-sm font-mono text-yellow-300">
                      {metrics.cpu.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{ width: `${metrics.cpu}%` }}
                    />
                  </div>
                </div>

                {/* Memory */}
                <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500">Memory</span>
                    <span className="text-sm font-mono text-blue-300">
                      {metrics.memory.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 transition-all duration-300"
                      style={{ width: `${metrics.memory}%` }}
                    />
                  </div>
                </div>

                {/* Temperature */}
                <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Temperature</span>
                    <span
                      className={`text-lg font-mono font-bold ${
                        metrics.temp < 60
                          ? "text-blue-300"
                          : metrics.temp <= 75
                          ? "text-amber-400"
                          : "text-red-500"
                      }`}
                    >
                      {metrics.temp.toFixed(1)}°C
                    </span>
                  </div>
                </div>

                {/* Power State */}
                <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Power State</span>
                    <span
                      className={`text-sm font-mono ${
                        metrics.powerState === "normal"
                          ? "text-green-400"
                          : metrics.powerState === "low"
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {metrics.powerState.toUpperCase()}
                    </span>
                  </div>
                  {metrics.powerWattage && (
                    <div className="mt-2 text-xs text-slate-400 font-mono">
                      {metrics.powerWattage.toFixed(2)}W
                    </div>
                  )}
                </div>

                {/* Uptime */}
                <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Uptime</span>
                    <span className="text-sm font-mono text-purple-300">{metrics.uptime}</span>
                  </div>
                </div>

                {/* Network Activity */}
                <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500">Network Activity</span>
                    <span className="text-xs font-mono text-cyan-300">
                      {metrics.networkActivity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        metrics.networkActive ? "bg-green-400 animate-pulse" : "bg-slate-600"
                      }`}
                    />
                    <span className="text-xs text-slate-400">
                      {metrics.networkActive ? "Active" : "Idle"}
                    </span>
                  </div>
                </div>

                {/* Heartbeat Stability */}
                <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500">Heartbeat Stability</span>
                    <span
                      className={`text-xs font-mono ${
                        metrics.heartbeatStability === "stable"
                          ? "text-green-400"
                          : metrics.heartbeatStability === "unstable"
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {metrics.heartbeatStability.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 w-1 rounded-full transition-colors ${
                            i < metrics.heartbeatQuality
                              ? "bg-green-400"
                              : "bg-slate-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">
                      Last: {metrics.lastHeartbeat}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-slate-500 text-sm">Loading metrics...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

