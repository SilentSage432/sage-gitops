import React, { useState, useEffect } from "react";
import { Server, Cpu, Wifi, Activity } from "lucide-react";
import { createSimulatedNode, SimNodeMetrics } from "@/simulated/simTelemetry";

const mockPiNodes = [
  {
    id: "pi-alpha",
    label: "Pi-Alpha",
    status: "ONLINE",
    ip: "192.168.10.21",
  },
  {
    id: "pi-beta",
    label: "Pi-Beta",
    status: "BOOTING",
    ip: "pending…",
  },
  {
    id: "pi-gamma",
    label: "Pi-Gamma",
    status: "OFFLINE",
    ip: "unreachable",
  },
];

const statusColors: Record<string, string> = {
  ONLINE: "text-green-400 bg-green-400/10",
  BOOTING: "text-yellow-400 bg-yellow-400/10",
  OFFLINE: "text-red-400 bg-red-400/10",
  UNKNOWN: "text-slate-400 bg-slate-400/10",
};

interface NodeWithMetrics {
  id: string;
  label: string;
  status: string;
  ip: string;
  metrics?: SimNodeMetrics;
}

export const PiClusterChamber = () => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodesWithMetrics, setNodesWithMetrics] = useState<NodeWithMetrics[]>([]);

  useEffect(() => {
    const generators = mockPiNodes.map(() => createSimulatedNode());
    
    const updateMetrics = () => {
      setNodesWithMetrics(
        mockPiNodes.map((node, idx) => ({
          ...node,
          metrics: generators[idx](),
        }))
      );
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 3000);

    return () => clearInterval(interval);
  }, []);

  const active = nodesWithMetrics.find((n) => n.id === selectedNode);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold tracking-wide text-purple-300">
        Pi Kluster
      </h2>
      <p className="text-sm text-slate-400">Cluster readiness pending federation ignition.</p>
      {/* NODE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {nodesWithMetrics.map((node) => (
          <button
            key={node.id}
            onClick={() => setSelectedNode(node.id)}
            className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl
            hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/10
            transition flex flex-col gap-3 text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-300" />
                <span className="text-slate-200 font-medium">{node.label}</span>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium
                ${statusColors[node.status]}`}
              >
                {node.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-2 whitespace-normal break-all">
              <Cpu className="w-3 h-3" /> {node.metrics ? `${node.metrics.cpu}%` : "—"}
              <Activity className="w-3 h-3" /> {node.metrics ? `${node.metrics.temp}°C` : "—"}
              <Wifi className="w-3 h-3" /> {node.ip}
            </div>
          </button>
        ))}
      </div>
      {/* RIGHT-SIDE DETAILS DRAWER */}
      {active && (
        <div className="fixed right-0 top-0 bottom-0 w-96 bg-[#0b0b12]/95 backdrop-blur-xl
        border-l border-slate-800 shadow-2xl p-6 animate-in fade-in duration-300 overflow-y-auto">
          <h3 className="text-xl font-semibold text-purple-300 mb-4">
            {active.label}
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/60 rounded border border-slate-800">
              <p className="text-sm text-slate-400">Status</p>
              <span className={`text-sm ${statusColors[active.status]}`}>
                {active.status}
              </span>
            </div>
            <div className="p-4 bg-slate-900/60 rounded border border-slate-800 space-y-2">
              <p className="text-sm text-slate-400">CPU</p>
              <p className="text-slate-200">{active.metrics ? `${active.metrics.cpu}%` : "—"}</p>
            </div>
            <div className="p-4 bg-slate-900/60 rounded border border-slate-800 space-y-2">
              <p className="text-sm text-slate-400">Temperature</p>
              <p className="text-slate-200">{active.metrics ? `${active.metrics.temp}°C` : "—"}</p>
            </div>
            {active.metrics && (
              <div className="p-4 bg-slate-900/60 rounded border border-slate-800 space-y-2">
                <p className="text-sm text-slate-400">Latency</p>
                <p className="text-slate-200">{active.metrics.latency}ms</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSelectedNode(null)}
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

