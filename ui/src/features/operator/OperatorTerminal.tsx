import { useState, useEffect, useRef, useMemo } from "react";

import "./OperatorTerminal.css";
import {
  TelemetryFilter,
  useTelemetryFilter,
} from "../../core/filters/useTelemetryFilter";

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
    ]);
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

      <div className="terminal-input-bar">
        <input
          className="terminal-input"
          value={input}
          placeholder="Issue command..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button className="terminal-send" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
}
