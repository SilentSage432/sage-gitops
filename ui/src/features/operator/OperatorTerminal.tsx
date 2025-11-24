import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";

import "./OperatorTerminal.css";
import {
  TelemetryFilter,
  useTelemetryFilter,
} from "../../core/filters/useTelemetryFilter";
import { useOperatorMemory } from "../../core/OperatorMemoryContext";
import { routeCommand } from "../../sage/commandRouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [hasRipple, setHasRipple] = useState(false);

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
    
    // Trigger ripple effect
    setHasRipple(true);
    setTimeout(() => setHasRipple(false), 300);
    
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
    <Card className={`prime-terminal-aura prime-terminal-panel ${isIdle ? "prime-terminal-idle" : isJustActivated ? "prime-terminal-activated" : "prime-terminal-active"}`}>
      {/* Filter Bar */}
      <div className="terminal-filter-bar">
        {FILTERS.map((cat) => (
          <Badge
            key={cat}
            variant={activeFilter === cat ? "default" : "outline"}
            className={`terminal-filter-btn cursor-pointer ${
              activeFilter === cat ? "on" : "off"
            }`}
            onClick={() => setActiveFilter(cat)}
          >
            {cat.toUpperCase()}
          </Badge>
        ))}
      </div>

      {/* Log Output (Scrollable Feed) */}
      <motion.div
        className={`prime-terminal-log ${hasRipple ? "prime-ripple" : ""}`}
        ref={logRef}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {filteredLog.map((entry, idx) => (
          <motion.div
            key={`${entry.ts}-${idx}`}
            className={
              entry.isCommand
                ? "prime-terminal-line prime-terminal-line-command text-sm mb-1 whitespace-pre-wrap terminal-line"
                : `prime-terminal-line prime-terminal-line-${entry.category.toLowerCase()} text-sm mb-1 whitespace-pre-wrap opacity-90 terminal-line cat-${entry.category.toLowerCase()}`
            }
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
          >
            {entry.message || entry.text}
          </motion.div>
        ))}
      </motion.div>

      {/* Command Bar (Bottom Anchored) */}
      <motion.div
        className={`prime-terminal-input ${isProcessing ? "prime-terminal-processing" : ""}`}
        animate={{
          boxShadow: isInputFocused
            ? "0 0 18px rgba(128, 90, 213, 0.35)"
            : "0 0 0px rgba(128, 90, 213, 0)",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="flex items-center gap-3">
          <Input
            className="flex-1 text-base"
            value={input}
            placeholder="Issue command..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
          />
          <Button
            className="sage-command-send text-base px-5 py-3"
            onClick={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            Send
          </Button>
        </div>
      </motion.div>
    </Card>
  );
}
