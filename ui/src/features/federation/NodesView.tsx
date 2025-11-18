import React from "react";
import { useNodes } from "./useNodes";

export const NodesView: React.FC = () => {
  const nodes = useNodes();

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-slate-100">Federation Nodes</h2>

      <div className="grid grid-cols-1 gap-4">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="p-4 bg-slate-900/40 border border-slate-700 rounded"
          >
            <div className="text-xl">{node.id}</div>
            <div className="text-slate-400">Role: {node.role}</div>
            <div
              className={
                node.status === "online" ? "text-green-400" : "text-red-400"
              }
            >
              Status: {node.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
