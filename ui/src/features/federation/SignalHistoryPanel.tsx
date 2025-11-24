import React from "react";

import { useKernelSignal } from "../../sage/kernel/useKernelSignal";

import { useMeshTelemetry } from "../../sage/telemetry/useMeshTelemetry";



export const SignalHistoryPanel: React.FC = () => {

  const pulse = useKernelSignal("kernel.pulse");

  const warning = useKernelSignal("kernel.warning");

  const flash = useKernelSignal("kernel.flash");

  const telemetry = useMeshTelemetry();



  const entries = [

    pulse && { type: "pulse", ts: Date.now() },

    warning && { type: "warning", ts: Date.now() },

    flash && { type: "flash", ts: Date.now() },

    ...telemetry.map((t) => ({

      type: "telemetry",

      ts: t.timestamp || Date.now(),

      payload: t,

    })),

  ].filter(Boolean);



  return (
    <div className="h-full flex flex-col overflow-hidden w-full">
      {/* HEADER */}
      <div className="p-6 border-b border-slate-800 flex-shrink-0">
        <h2 className="text-2xl font-bold tracking-wide text-purple-300 mb-2">
          Live Signal History
        </h2>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="p-6 space-y-3 min-w-0">
          {entries.length === 0 && (
            <p className="text-slate-500 text-sm">No signals yet…</p>
          )}

          {entries
            .slice(-200)
            .reverse()
            .map((entry: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded border border-slate-800 bg-slate-900/60 min-w-0 overflow-hidden"
              >
                <p className="text-xs text-slate-500 mb-1 truncate">
                  {new Date(entry.ts).toLocaleTimeString()}
                </p>
                <p
                  className={`text-sm font-mono truncate ${
                    entry.type === "warning"
                      ? "text-red-400"
                      : entry.type === "pulse"
                      ? "text-green-300"
                      : entry.type === "flash"
                      ? "text-yellow-300"
                      : "text-blue-300"
                  }`}
                >
                  {entry.type.toUpperCase()}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

};

