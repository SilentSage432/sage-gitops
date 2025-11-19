import React, { useState } from "react";
import "./OperatorTerminal.css";

interface OperatorTerminalProps {
  onNavigate?: (target: string) => void;
}

export const OperatorTerminal: React.FC<OperatorTerminalProps> = () => {
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setLogs((prev) => [...prev, `> ${userText}`]);
    setInput("");

    try {
      const res = await fetch("http://localhost:7070/api/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userText })
      });

      const data = await res.json();
      setLogs((prev) => [...prev, JSON.stringify(data, null, 2)]);
    } catch (err) {
      setLogs((prev) => [...prev, "[error] Could not process intent"]);
    }
  };

  return (
    <div className="terminal-wrapper h-full flex flex-col">
      {/* Scrollable log window - takes remaining space */}
      <div
        id="terminal-log"
        className="flex-1 overflow-y-auto p-4 text-[#cfcfcf] text-sm font-mono space-y-1 min-h-0"
      >
        {logs.map((line, idx) => (
          <div key={idx} className="whitespace-pre-wrap">{line}</div>
        ))}
      </div>

      {/* Fixed bottom input bar */}
      <div className="flex-shrink-0 border-t border-[#222] bg-[#0d0d0d] p-3 flex items-center gap-2 z-10">
        <input
          placeholder="Issue command..."
          className="flex-1 bg-[#1a1a1d] border border-[#333] px-3 py-2 text-[#cfcfcf] text-sm font-mono focus:outline-none focus:border-[#6f42c1] focus:ring-0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />

        <button
          onClick={handleSend}
          className="flex-shrink-0 px-4 py-2 bg-[#6f42c1] hover:bg-[#8b5bf0] text-white text-sm font-mono border-0 cursor-pointer rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
};

