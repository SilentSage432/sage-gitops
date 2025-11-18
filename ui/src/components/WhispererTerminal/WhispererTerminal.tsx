import React, { useState } from "react";
import { useWhispererBridge } from "./useWhispererBridge";

export const WhispererTerminal: React.FC = () => {
  const { messages, sendMessage } = useWhispererBridge();
  const [input, setInput] = useState("");

  return (
    <div className="flex flex-col h-full bg-black/30 backdrop-blur-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-2 text-sage-green font-mono">
        {messages.map((m) => (
          <div key={m.id} className="whitespace-pre-wrap">
            <span className="opacity-60">[{new Date(m.timestamp).toLocaleTimeString()}]</span>{" "}
            <span className={m.role === "operator" ? "text-blue-300" : "text-purple-300"}>
              {m.role.toUpperCase()}:
            </span>{" "}
            {m.text}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-slate-800 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              sendMessage(input.trim());
              setInput("");
            }
          }}
          className="flex-1 bg-black/40 text-slate-200 px-3 py-2 rounded border border-slate-700"
          placeholder="Send command to Whisperer..."
        />
      </div>
    </div>
  );
};
