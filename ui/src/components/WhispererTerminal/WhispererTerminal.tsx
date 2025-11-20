import React, { useEffect, useRef, useState } from "react";

import "./whisperer.css";

export const WhispererTerminal = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:7070/stream");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Filter enforcement — ONLY store what the filter allows
      if (filter && data.type !== filter) return;

      setLogs((prev) => [...prev, data]);
    };

    return () => ws.close();
  }, [filter]);

  // Auto-scroll to bottom on every new log
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full w-full bg-black text-white overflow-hidden">
      {/* Filter buttons */}
      <div className="flex flex-row gap-2 p-3 border-b border-gray-700 bg-[#111]">
        <button onClick={() => setFilter(null)}>ALL</button>
        <button onClick={() => setFilter("SYSTEM")}>SYSTEM</button>
        <button onClick={() => setFilter("ARC")}>ARC</button>
        <button onClick={() => setFilter("RHO2")}>RHO²</button>
        <button onClick={() => setFilter("FEDERATION")}>FEDERATION</button>
        <button onClick={() => setFilter("AGENT")}>AGENT</button>
        <button onClick={() => setFilter("WHISPERER")}>WHISPERER</button>
        <button onClick={() => setFilter("ERROR")}>ERROR</button>
        <button onClick={() => setFilter("DEBUG")}>DEBUG</button>
        <button onClick={() => setFilter("HEARTBEAT")}>HEARTBEAT</button>
      </div>

      {/* Terminal log window */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
        {logs.map((log, index) => (
          <div key={index} className="mb-1">
            [{log.type}] {log.message}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};
