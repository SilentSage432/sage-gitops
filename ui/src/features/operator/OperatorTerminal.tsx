import React, { useState } from "react";

interface OperatorTerminalProps {
  onNavigate?: (target: string) => void;
}

export const OperatorTerminal: React.FC<OperatorTerminalProps> = () => {
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const sendCommand = () => {
    if (!input.trim()) return;
    setLogs((prev) => [...prev, `> ${input}`]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full w-full bg-black/20">

      {/* Scrollable log window */}
      <div
        id="terminal-log"
        className="flex-1 overflow-y-auto p-4 text-slate-200 text-sm space-y-1"
      >
        {logs.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
      </div>

      {/* Bottom input bar */}
      <div className="border-t border-slate-800 p-4 flex items-center gap-2 bg-black/30">
        <input
          placeholder="Issue command..."
          className="flex-1 bg-black/40 border border-slate-700 rounded px-3 py-2 text-slate-100 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendCommand()}
        />

        <button
          onClick={sendCommand}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm"
        >
          Send
        </button>
      </div>

    </div>
  );
};

