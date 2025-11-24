import React from "react";
import { Server } from "lucide-react";
import { FederationNodeStatus } from "./useFederationNodes";

interface NodeGridProps {
  nodes: FederationNodeStatus[];
  onSelectNode: (nodeId: string) => void;
}

export const NodeGrid: React.FC<NodeGridProps> = ({ nodes, onSelectNode }) => {
  // Sort: online > degraded > offline
  const sortedNodes = [...nodes].sort((a, b) => {
    const statusOrder = { online: 0, degraded: 1, offline: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  if (sortedNodes.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-slate-700/50 rounded-lg">
        <Server className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <p className="text-sm text-slate-400">No nodes registered yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 min-w-0">
      {sortedNodes.map((node) => {
        const statusClasses = {
          online: "border-purple-500/50 bg-purple-500/10 shadow-[0_0_16px_rgba(168,85,247,0.4)]",
          degraded: "border-amber-500/50 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse",
          offline: "border-red-500/30 bg-red-500/5 opacity-60",
        }[node.status];

        return (
          <button
            key={node.id}
            onClick={() => onSelectNode(node.id)}
            className={`
              relative p-4 rounded-lg border-2 transition-all
              hover:scale-105 hover:shadow-lg
              ${statusClasses}
              min-w-0 overflow-hidden
            `}
          >
            <div className="flex flex-col items-center gap-2 min-w-0">
              <Server className={`w-8 h-8 ${
                node.status === "online" ? "text-purple-300" :
                node.status === "degraded" ? "text-amber-300" :
                "text-red-300"
              }`} />
              <div className="text-center min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{node.id}</p>
                <p className={`text-xs mt-1 ${
                  node.status === "online" ? "text-purple-300" :
                  node.status === "degraded" ? "text-amber-300" :
                  "text-red-300"
                }`}>
                  {node.status.toUpperCase()}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

