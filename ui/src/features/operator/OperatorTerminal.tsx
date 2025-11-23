import { useState, useEffect, useRef, useMemo } from "react";

import "./OperatorTerminal.css";
import {
  TelemetryFilter,
  useTelemetryFilter,
} from "../../core/filters/useTelemetryFilter";
import { useOperatorMemory } from "../../core/OperatorMemoryContext";
import { routeCommand } from "../../sage/commandRouter";

type LogCategory = Exclude<TelemetryFilter, "ALL">;

const FILTERS: TelemetryFilter[] = [
  "ALL",
  "SYSTEM",
  "ARC",
  "RHO2",
  "FEDERATION",
  "AGENT",
  "WHISPERER",
  "ERROR",
  "DEBUG",
  "HEARTBEAT",
];

const CATEGORY_SET = new Set<LogCategory>(
  FILTERS.filter((f) => f !== "ALL") as LogCategory[]
);

export default function OperatorTerminal() {
  const { activeFilter, setActiveFilter } = useTelemetryFilter();
  const { remember, recallRecent } = useOperatorMemory();

  const [input, setInput] = useState("");
  const [log, setLog] = useState<
    { text: string; category: LogCategory; ts: number }[]
  >([]);

  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { text, category = "SYSTEM" } = e.detail || {};
      const normalized = normalizeCategory(category);

      setLog((prev) => [...prev, { text, category: normalized, ts: Date.now() }]);
    };

    window.addEventListener("SAGE_TERMINAL_LOG", handler as EventListener);
    return () =>
      window.removeEventListener("SAGE_TERMINAL_LOG", handler as EventListener);
  }, []);

  function normalizeCategory(value?: string): LogCategory {
    const upper = (value || "SYSTEM").toUpperCase() as TelemetryFilter;
    if (upper === "ALL") return "SYSTEM";
    if (CATEGORY_SET.has(upper as LogCategory)) {
      return upper as LogCategory;
    }
    return "SYSTEM";
  }

  const handleSend = async () => {
    if (!input.trim()) return;
    const inputValue = input.trim();
    setInput("");
    remember(inputValue, "operator");
    
    const response = await routeCommand(inputValue);
    setLog((prev) => [
      ...prev,
      { text: response.message, category: "WHISPERER", ts: response.timestamp },
    ]);
  };

  const filteredLog = useMemo(() => {
    if (activeFilter === "ALL") return log;
    return log.filter((entry) => entry.category === activeFilter);
  }, [activeFilter, log]);

  return (
    <div className="federation-intel-stack operator-terminal-container flex flex-col h-full overflow-hidden">
      {/* SAGE Federation Header */}
      <div className="sage-operator-header px-4 py-3">
        <h2 className="text-sm tracking-wide uppercase opacity-80">
          Telemetry & Control
        </h2>
      </div>

      {/* Filter Bar */}
      <div className="terminal-filter-bar">
        {FILTERS.map((cat) => (
          <button
            key={cat}
            className={`terminal-filter-btn ${
              activeFilter === cat ? "on" : "off"
            }`}
            onClick={() => setActiveFilter(cat)}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Log Output (Scrollable Feed) */}
      <div className="command-bridge-log flex-1 overflow-y-auto px-4 py-4 sage-terminal-log" ref={logRef}>
        {filteredLog.map((entry, idx) => (
          <div key={idx} className={`text-sm mb-1 whitespace-pre-wrap opacity-90 terminal-line cat-${entry.category.toLowerCase()}`}>
            {entry.text}
          </div>
        ))}
      </div>

      {/* Command Bar (Bottom Anchored) */}
      <div className="sage-command-bar flex items-center gap-3 px-4 py-3">
        <input
          className="flex-1 bg-transparent border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-white/40 text-white"
          value={input}
          placeholder="Issue command..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          className="sage-command-send bg-purple-600 hover:bg-purple-500 rounded-xl px-4 py-2 text-white transition-all"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
}
