import React from "react";
import { useThoughtStream } from "../../sage/cognition/useThoughtStream";

export default function CognitionPanel() {
  const thoughts = useThoughtStream();

  return (
    <div className="p-4 text-sm font-mono text-slate-300 space-y-2 overflow-y-auto h-full">
      {thoughts.map((t) => (
        <div
          key={t.id}
          className={`
            p-2 border rounded
            ${t.tags?.includes("alert") ? "bg-red-900/30 border-red-700" : "bg-slate-900/40 border-slate-800"}
          `}
        >
          <div className="text-purple-400 text-xs">{t.from.toUpperCase()}</div>
          <div>{t.text}</div>
          <div className="text-xs text-slate-500">
            {new Date(t.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
}

