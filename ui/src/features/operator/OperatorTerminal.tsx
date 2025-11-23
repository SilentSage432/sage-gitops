import { useState, useEffect, useRef, useMemo } from "react";

import "./OperatorTerminal.css";
import {
  TelemetryFilter,
  useTelemetryFilter,
} from "../../core/filters/useTelemetryFilter";
import { useOperatorMemory } from "../../core/OperatorMemoryContext";

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

  function handleSend() {
    if (!input.trim()) return;
    setLog((prev) => [
      ...prev,
      { text: `> ${input}`, category: "WHISPERER", ts: Date.now() },
      ...recallRecent(1).map(m => ({ text: `⟲ ${m.text}`, category: "WHISPERER" as LogCategory, ts: Date.now() })),
    ]);
    remember(input, "operator");
    setInput("");
  }

  const filteredLog = useMemo(() => {
    if (activeFilter === "ALL") return log;
    return log.filter((entry) => entry.category === activeFilter);
  }, [activeFilter, log]);

  return (
    <div className="terminal-wrapper">
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

      <div className="terminal-log" ref={logRef}>
        {filteredLog.map((entry, idx) => (
          <div key={idx} className={`terminal-line cat-${entry.category.toLowerCase()}`}>
            {entry.text}
          </div>
        ))}
      </div>

      <div className="sage-command-bar flex items-center gap-3">
        <input
          className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-white/30 text-white"
          value={input}
          placeholder="Issue command..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button className="bg-purple-600 hover:bg-purple-500 rounded-xl px-4 py-2 text-white transition-colors" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
}
