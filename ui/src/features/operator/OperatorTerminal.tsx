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
    <div className="absolute -m-6 inset-0 bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Scrollable log window - takes remaining space */}
      <div
        id="terminal-log"
        className="flex-1 overflow-y-auto p-4 text-[#cfcfcf] text-sm font-mono space-y-1"
        style={{ paddingBottom: '64px' }}
      >
        {logs.map((line, idx) => (
          <div key={idx} className="whitespace-pre-wrap">{line}</div>
        ))}
      </div>

      {/* Fixed bottom input bar */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-[#222] bg-[#0d0d0d] p-3 flex items-center gap-2 z-10">
        <input
          placeholder="Issue command..."
          className="flex-1 bg-[#1a1a1d] border border-[#333] px-3 py-2 text-[#cfcfcf] text-sm font-mono focus:outline-none focus:border-[#6f42c1]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendCommand()}
        />

        <button
          onClick={sendCommand}
          className="px-4 py-2 bg-[#6f42c1] hover:bg-[#8b5bf0] text-white text-sm font-mono border-0 cursor-pointer"
        >
          Send
        </button>
      </div>
    </div>
  );
};

