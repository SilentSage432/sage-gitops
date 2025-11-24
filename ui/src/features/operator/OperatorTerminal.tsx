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
    { text?: string; message?: string; category: LogCategory; ts: number; isCommand?: boolean }[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [isJustActivated, setIsJustActivated] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(Date.now());

  const logRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user has manually scrolled up
  useEffect(() => {
    const handleScroll = () => {
      if (!logRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = logRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      userScrolledRef.current = !isNearBottom;
    };

    const logElement = logRef.current;
    if (logElement) {
      logElement.addEventListener("scroll", handleScroll);
      return () => logElement.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Auto-scroll to bottom when new entries arrive (only if user hasn't scrolled up)
  useEffect(() => {
    if (logRef.current && !userScrolledRef.current) {
      // Clear any pending scroll
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      // Smooth scroll after a brief delay to ensure DOM is updated
      scrollTimeoutRef.current = setTimeout(() => {
        if (logRef.current && !userScrolledRef.current) {
          logRef.current.scrollTo({
            top: logRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 50);
    }
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [log]);

  // Track idle state (12 seconds without messages)
  useEffect(() => {
    const checkIdle = () => {
      const timeSinceLastMessage = Date.now() - lastMessageTime;
      setIsIdle(timeSinceLastMessage > 12000);
    };

    const interval = setInterval(checkIdle, 1000);
    checkIdle(); // Initial check

    return () => clearInterval(interval);
  }, [lastMessageTime]);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { text, category = "SYSTEM" } = e.detail || {};
      const normalized = normalizeCategory(category);
      const now = Date.now();

      setLog((prev) => [...prev, { text, category: normalized, ts: now }]);
      setLastMessageTime(now);
      setIsIdle(false);
      setIsJustActivated(true);
      // Reset activation state after 900ms
      setTimeout(() => setIsJustActivated(false), 900);
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
    const command = input;
    setInput("");
    remember(command, "operator");
    setIsProcessing(true);
    const now = Date.now();
      setLastMessageTime(now);
      setIsIdle(false);
      setIsJustActivated(true);
      setTimeout(() => setIsJustActivated(false), 900);
    
    // Add command to log for visual feedback
    setLog((prev) => [
      ...prev,
      {
        text: command,
        category: "SYSTEM" as LogCategory,
        ts: now,
        isCommand: true,
      },
    ]);
    
    await routeCommand(command, (response) => {
      const responseTime = response.timestamp || Date.now();
      setLog((prev) => [
        ...prev,
        {
          message: response.message,
          category: (response.status === "failed" ? "ERROR" : "WHISPERER") as LogCategory,
          ts: responseTime,
        },
      ]);
      setLastMessageTime(responseTime);
      setIsIdle(false);
      setIsJustActivated(true);
      setTimeout(() => setIsJustActivated(false), 900);
    });
    
    setIsProcessing(false);
  };

  const filteredLog = useMemo(() => {
    const filtered = activeFilter === "ALL" 
      ? log 
      : log.filter((entry) => entry.category === activeFilter);
    console.log("Filtered log:", { activeFilter, totalLog: log.length, filteredCount: filtered.length, filtered });
    return filtered;
  }, [activeFilter, log]);

  return (
    <div className={`prime-terminal-aura prime-terminal-panel ${isIdle ? "prime-terminal-idle" : isJustActivated ? "prime-terminal-activated" : "prime-terminal-active"}`}>
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
      <div className="prime-terminal-log" ref={logRef}>
        {filteredLog.map((entry, idx) => (
          <div
            key={idx}
            className={
              entry.isCommand
                ? "prime-terminal-line prime-terminal-line-command text-sm mb-1 whitespace-pre-wrap terminal-line"
                : `prime-terminal-line prime-terminal-line-${entry.category.toLowerCase()} text-sm mb-1 whitespace-pre-wrap opacity-90 terminal-line cat-${entry.category.toLowerCase()}`
            }
          >
            {entry.message || entry.text}
          </div>
        ))}
      </div>

      {/* Command Bar (Bottom Anchored) */}
      <div className={`prime-terminal-input ${isProcessing ? "prime-terminal-processing" : ""}`}>
        <div className="flex items-center gap-3">
          <input
            className="flex-1 bg-transparent border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-white/40 text-white text-base"
            value={input}
            placeholder="Issue command..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            type="button"
            className="sage-command-send bg-purple-600 hover:bg-purple-500 rounded-xl px-5 py-3 text-white transition-all text-base"
            onClick={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
