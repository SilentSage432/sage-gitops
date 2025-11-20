import React, { useState } from "react";
import "./OperatorTerminal.css";
import { usePulseStore } from "../../sage/state/pulseStore";

interface OperatorTerminalProps {
  onNavigate?: (target: string) => void;
}

export const OperatorTerminal: React.FC<OperatorTerminalProps> = () => {
  const [input, setInput] = useState("");
  const pulses = usePulseStore((s) => s.pulses);

  function handleSend() {
    if (!input.trim()) return;

    fetch("http://localhost:7070/api/whisperer/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });

    setInput("");
  }

  return (
    <div className="terminal-wrapper h-full flex flex-col">
      <div className="terminal-log flex-1 overflow-y-auto p-4 text-[#cfcfcf] text-sm font-mono space-y-1 min-h-0">
        {pulses.map((p, i) => (
          <div key={i}>
            <strong>{p.signal}</strong> — {p.source}
          </div>
        ))}
      </div>

      <div className="terminal-input-bar flex-shrink-0 border-t border-[#222] bg-[#0d0d0d] p-3 flex items-center gap-2 z-10">
        <input
          className="terminal-input flex-1 bg-[#1a1a1d] border border-[#333] px-3 py-2 text-[#cfcfcf] text-sm font-mono focus:outline-none focus:border-[#6f42c1] focus:ring-0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Send Federation Command..."
        />
        <button className="terminal-send flex-shrink-0 px-4 py-2 bg-[#6f42c1] hover:bg-[#8b5bf0] text-white text-sm font-mono border-0 cursor-pointer rounded" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
};

