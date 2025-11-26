/**
 * Agent Library Panel
 * Displays the canonical agent library — SAGE's genetic archive
 */

import React from "react";
import { useAgentLibrary } from "./library/useAgentLibrary";

export const AgentLibraryPanel: React.FC = () => {
  const { library } = useAgentLibrary();

  return (
    <div className="h-full flex flex-col overflow-hidden w-full">
      {/* HEADER */}
      <div className="p-6 border-b border-slate-800 flex-shrink-0">
        <h2 className="text-3xl font-bold text-slate-200 mb-2">Agent Library</h2>
        <p className="text-slate-400 text-sm">
          The genetic archive of all SAGE-capable agent archetypes.
        </p>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="p-6 space-y-4">
          {library.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/50 rounded border border-slate-800">
              <p className="text-sm text-slate-400">
                No agents in library yet.
              </p>
            </div>
          ) : (
            library.map((item) => (
              <div
                key={item.id}
                className="p-4 border border-slate-800 bg-[#0e0e14] rounded-lg shadow-md hover:border-slate-700 transition-colors"
              >
                <h3 className="text-xl font-semibold text-slate-200 mb-2">{item.name}</h3>
                <p className="text-sm text-slate-400 mb-3">{item.description}</p>

                <div className="flex items-center gap-3 mb-3">
                  <div className="text-xs text-slate-500 uppercase tracking-wider">
                    CLASS:
                  </div>
                  <div className="text-xs px-2 py-1 bg-purple-900/30 border border-purple-700/40 rounded text-purple-300 font-medium">
                    {item.class}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {item.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-slate-300"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};


