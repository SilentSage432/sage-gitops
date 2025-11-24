import React from "react";



interface NodeDetailsPanelProps {

  nodeId: string;

}



export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({ nodeId }) => {

  return (
    <div className="h-full flex flex-col overflow-hidden w-full">
      {/* HEADER */}
      <div className="p-6 border-b border-slate-800 flex-shrink-0">
        <h2 className="text-2xl font-bold tracking-wide text-purple-300 mb-2">
          Node: {nodeId}
        </h2>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="p-6 space-y-6 min-w-0">

          <div className="grid grid-cols-2 gap-4 min-w-0">

            <div className="p-4 bg-slate-900/60 rounded border border-slate-800 min-w-0 overflow-hidden">
              <p className="text-xs text-slate-500 mb-1 truncate">Status</p>
              <p className="text-green-400 font-mono text-lg truncate">ONLINE</p>
            </div>

            <div className="p-4 bg-slate-900/60 rounded border border-slate-800 min-w-0 overflow-hidden">
              <p className="text-xs text-slate-500 mb-1 truncate">Uptime</p>
              <p className="text-slate-300 font-mono text-lg truncate">00:00:00</p>
            </div>

            <div className="p-4 bg-slate-900/60 rounded border border-slate-800 min-w-0 overflow-hidden">
              <p className="text-xs text-slate-500 mb-1 truncate">CPU Load</p>
              <p className="text-yellow-300 font-mono text-lg truncate">0.3%</p>
            </div>

            <div className="p-4 bg-slate-900/60 rounded border border-slate-800 min-w-0 overflow-hidden">
              <p className="text-xs text-slate-500 mb-1 truncate">Memory</p>
              <p className="text-blue-300 font-mono text-lg truncate">214 MB</p>
            </div>
          </div>

          <div className="p-4 bg-slate-900/60 rounded border border-slate-800 min-w-0 overflow-hidden">
            <p className="text-xs text-slate-500 mb-2 truncate">Last Heartbeat</p>
            <p className="text-purple-300 font-mono truncate">just now</p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded border border-slate-800 min-w-0 overflow-hidden">
            <p className="text-xs text-slate-500 mb-2 truncate">Recent Signals</p>
            <p className="text-slate-500 text-sm break-words">No events yet…</p>
          </div>
        </div>
      </div>
    </div>

  );

};

