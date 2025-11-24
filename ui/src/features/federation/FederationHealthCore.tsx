import React, { useState } from "react";
import { Activity, Radio, RefreshCw, Shield, Clock } from "lucide-react";
import { FederationTopology } from "./health/FederationTopology";
import { useTopologyNodes } from "./health/useTopologyNodes";
import { NodeFusionPanel } from "./health/NodeFusionPanel";

export const FederationHealthCore = () => {
  const topologyNodes = useTopologyNodes();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  return (
    <div className="h-full flex flex-col overflow-hidden w-full">
      {/* HEADER */}
      <div className="p-6 border-b border-slate-800 flex-shrink-0">
        <h2 className="text-2xl font-bold tracking-wide text-purple-300 mb-2">
          Federation Health
        </h2>
        <p className="text-sm text-slate-400">
          Real-time system integrity overview
        </p>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="p-6 space-y-6 min-w-0">
          {/* TOPOLOGY VISUALIZATION */}
          <div className="min-w-0 overflow-hidden">
            <h3 className="text-lg font-semibold text-slate-200 mb-3 truncate">Network Topology</h3>
            <FederationTopology
              nodes={topologyNodes}
              selectedNodeId={selectedNodeId}
              onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
            />
          </div>

          {/* STATUS SUMMARY GRID */}
          <div className="grid grid-cols-2 gap-4 min-w-0">
            {/* MESH STATUS */}
            <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between mb-2 gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Activity className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-400 truncate">Mesh Status</span>
                </div>
                <span className="px-2 py-1 rounded text-xs font-medium text-slate-400 bg-slate-400/10 whitespace-nowrap flex-shrink-0">
                  Offline
                </span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-slate-500 flex-shrink-0"></div>
                <span className="text-xs text-slate-500 truncate">Federation not initialized</span>
              </div>
            </div>

            {/* TELEMETRY STREAM */}
            <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between mb-2 gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Radio className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-400 truncate">Telemetry Stream</span>
                </div>
                <span className="px-2 py-1 rounded text-xs font-medium text-amber-400 bg-amber-400/10 whitespace-nowrap flex-shrink-0">
                  Inactive
                </span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0"></div>
                <span className="text-xs text-amber-500/70 truncate">Awaiting connection</span>
              </div>
            </div>

            {/* SYNCHRONIZATION */}
            <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between mb-2 gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <RefreshCw className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-400 truncate">Synchronization</span>
                </div>
                <span className="px-2 py-1 rounded text-xs font-medium text-slate-400 bg-slate-400/10 whitespace-nowrap flex-shrink-0 text-right">
                  Pending
                </span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-slate-500 flex-shrink-0"></div>
                <span className="text-xs text-slate-500 truncate">Awaiting nodes</span>
              </div>
            </div>

            {/* SECURITY POSTURE */}
            <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between mb-2 gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-400 truncate">Security Posture</span>
                </div>
                <span className="px-2 py-1 rounded text-xs font-medium text-emerald-400 bg-emerald-400/10 whitespace-nowrap flex-shrink-0">
                  Baseline
                </span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                <span className="text-xs text-emerald-500/70 truncate">Initialized</span>
              </div>
            </div>
          </div>

          {/* TIMELINE PLACEHOLDER */}
          <div className="bg-slate-900/60 rounded-lg border border-slate-800 p-6 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 mb-4 min-w-0">
              <Clock className="w-5 h-5 text-slate-500 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-slate-200 truncate">Event Timeline</h3>
            </div>
            <div className="p-8 text-center border-2 border-dashed border-slate-700/50 rounded-lg min-w-0 overflow-hidden">
              <p className="text-sm text-slate-400 break-words">
                Event timeline will appear when federation activates
              </p>
            </div>
          </div>

          {/* KEY METRICS BLOCK */}
          <div className="bg-slate-900/60 rounded-lg border border-slate-800 p-4 min-w-0 overflow-hidden">
            <h3 className="text-lg font-semibold text-slate-200 mb-4 truncate">Key Metrics</h3>
            <div className="space-y-3 min-w-0">
              <div className="flex items-center justify-between text-sm gap-2 min-w-0">
                <span className="text-slate-400 truncate">Heartbeat rate</span>
                <span className="text-slate-600 font-mono whitespace-nowrap flex-shrink-0">—</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-2 min-w-0">
                <span className="text-slate-400 truncate">Signal throughput</span>
                <span className="text-slate-600 font-mono whitespace-nowrap flex-shrink-0">—</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-2 min-w-0">
                <span className="text-slate-400 truncate">Cluster latency</span>
                <span className="text-slate-600 font-mono whitespace-nowrap flex-shrink-0">—</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-2 min-w-0">
                <span className="text-slate-400 truncate">Encryption rotation</span>
                <span className="text-slate-600 font-mono whitespace-nowrap flex-shrink-0">—</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-4 italic break-words">
              Metrics will populate once federation nodes come online
            </p>
          </div>
        </div>
      </div>

      {/* Node Fusion Panel */}
      {selectedNodeId && (
        <NodeFusionPanel
          nodeId={selectedNodeId}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
};

