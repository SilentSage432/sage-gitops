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
  const [suggestion, setSuggestion] = useState("");
  const [commandList] = useState([
    "help",
    "clear",
    "status",
    "rho2.status",
    "arc.list",
    "agents.list",
    "mesh.uptime",
    "node.info"
  ]);
  const [log, setLog] = useState<
    { text?: string; message?: string; category: LogCategory; ts: number; isCommand?: boolean }[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [isJustActivated, setIsJustActivated] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(Date.now());
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [hasRipple, setHasRipple] = useState(false);
  const [neuralState, setNeuralState] = useState<"processing" | "streaming" | "idle" | null>(null);
  const [lastInputTime, setLastInputTime] = useState(Date.now());
  const [isSilentIdle, setIsSilentIdle] = useState(false);
  const [isPreResponse, setIsPreResponse] = useState(false);
  const [showJumpToLive, setShowJumpToLive] = useState(false);

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
      setShowJumpToLive(!isNearBottom);
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

  // Track operator input idle state (12 seconds without input)
  useEffect(() => {
    const checkInputIdle = () => {
      const timeSinceInput = Date.now() - lastInputTime;
      if (timeSinceInput > 12000 && !isProcessing) {
        setNeuralState((current) => {
          if (current !== "streaming" && current !== "processing") {
            return "idle";
          }
          return current;
        });
      }
    };

    const interval = setInterval(checkInputIdle, 1000);
    checkInputIdle(); // Initial check

    return () => clearInterval(interval);
  }, [lastInputTime, isProcessing]);

  // Track silent idle state (10 seconds without input)
  useEffect(() => {
    const checkSilentIdle = () => {
      const timeSinceInput = Date.now() - lastInputTime;
      setIsSilentIdle(timeSinceInput > 10000);
    };

    const interval = setInterval(checkSilentIdle, 1000);
    checkSilentIdle(); // Initial check

    return () => clearInterval(interval);
  }, [lastInputTime]);

  // Clear streaming state after 400ms
  useEffect(() => {
    if (neuralState === "streaming") {
      const timeout = setTimeout(() => {
        setNeuralState((current) => current === "streaming" ? null : current);
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [neuralState]);

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
      
      // Trigger streaming state for new log entries (if not processing)
      setNeuralState((current) => {
        if (current !== "processing") {
          return "streaming";
        }
        return current;
      });
    };

    window.addEventListener("SAGE_TERMINAL_LOG", handler as EventListener);
    return () =>
      window.removeEventListener("SAGE_TERMINAL_LOG", handler as EventListener);
  }, []);

  // Mock event stream for live telemetry
  useEffect(() => {
    const eventTypes = [
      { signal: "HEARTBEAT_TICK", category: "HEARTBEAT" as LogCategory, source: "arc-bridge-local" },
      { signal: "AGENT_STATUS", category: "AGENT" as LogCategory, source: "agent-orchestrator" },
      { signal: "ARC_EVENT", category: "ARC" as LogCategory, source: "arc-core" },
      { signal: "RHO2_SIGNAL", category: "RHO2" as LogCategory, source: "rho2-bus" },
      { signal: "CONNECTED", category: "FEDERATION" as LogCategory, source: "federation-gateway" },
    ];

    const generateEvent = () => {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const now = Date.now();
      const timestamp = new Date(now).toLocaleTimeString();
      
      let message = "";
      switch (eventType.signal) {
        case "HEARTBEAT_TICK":
          message = `[${timestamp}] ♥ HEARTBEAT_TICK | ${eventType.source} | load: ${(Math.random() * 100).toFixed(1)}% | uptime: ${(performance.now() / 1000).toFixed(1)}s`;
          break;
        case "AGENT_STATUS":
          const agents = ["alpha", "beta", "gamma"];
          const agent = agents[Math.floor(Math.random() * agents.length)];
          message = `[${timestamp}] 🤖 AGENT_STATUS | ${agent} | state: ${Math.random() > 0.5 ? "active" : "idle"}`;
          break;
        case "ARC_EVENT":
          message = `[${timestamp}] ⚡ ARC_EVENT | ${eventType.source} | signal: ${Math.random() > 0.5 ? "pulse" : "sync"}`;
          break;
        case "RHO2_SIGNAL":
          message = `[${timestamp}] 🌊 RHO2_SIGNAL | ${eventType.source} | freq: ${(Math.random() * 1000).toFixed(0)}Hz`;
          break;
        case "CONNECTED":
          message = `[${timestamp}] 🔗 CONNECTED | ${eventType.source} | handshake complete`;
          break;
        default:
          message = `[${timestamp}] ${eventType.signal} | ${eventType.source}`;
      }

      setLog((prev) => [...prev, { text: message, category: eventType.category, ts: now }]);
      setLastMessageTime(now);
      setIsIdle(false);
      setIsJustActivated(true);
      setTimeout(() => setIsJustActivated(false), 900);
      
      setNeuralState((current) => {
        if (current !== "processing") {
          return "streaming";
        }
        return current;
      });
    };

    // Start with initial delay, then random intervals between 3-6 seconds
    const scheduleNext = () => {
      const delay = 3000 + Math.random() * 3000; // 3-6 seconds
      return setTimeout(() => {
        generateEvent();
        intervalRef.current = scheduleNext();
      }, delay);
    };

    const intervalRef = { current: scheduleNext() };

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
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
    
      // Trigger neural processing state
    setNeuralState("processing");
    setLastInputTime(now);
    setIsSilentIdle(false);
    // Clear idle state when processing starts
    setTimeout(() => {
      setNeuralState((current) => current === "processing" ? null : current);
    }, 900);
    
    // Pre-response tension
    setIsPreResponse(true);
    setTimeout(() => {
      setIsPreResponse(false);
    }, 120);
    
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
    <Card className={`prime-terminal-aura prime-terminal-panel ${isIdle ? "prime-terminal-idle" : isJustActivated ? "prime-terminal-activated" : "prime-terminal-active"} ${isSilentIdle ? "prime-silent-idle" : ""} ${isPreResponse ? "prime-pre-response" : ""}`} style={{ position: "relative" }}>
      {/* Neural Presence Overlay */}
      <div className={`prime-neural-overlay ${neuralState ? `prime-state-${neuralState}` : ""}`} />
      
      {/* Filter Bar */}
      <div className="terminal-filter-bar" style={{ position: "relative", zIndex: 10 }}>
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
        style={{ position: "relative", zIndex: 10 }}
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
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {entry.message || entry.text}
          </motion.div>
        ))}
      </motion.div>

      {/* Jump to Live Button */}
      {showJumpToLive && (
        <motion.div
          className="absolute bottom-20 right-8 z-30"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            className="bg-purple-600/80 hover:bg-purple-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm border border-purple-400/30"
            onClick={() => {
              if (logRef.current) {
                logRef.current.scrollTo({
                  top: logRef.current.scrollHeight,
                  behavior: "smooth",
                });
                userScrolledRef.current = false;
                setShowJumpToLive(false);
              }
            }}
          >
            Jump to Live
          </Button>
        </motion.div>
      )}

      {/* Command Bar (Bottom Anchored) */}
      <motion.div
        className={`prime-terminal-input ${isProcessing ? "prime-terminal-processing" : ""}`}
        style={{ position: "relative", zIndex: 10 }}
        animate={{
          boxShadow: isInputFocused
            ? "0 0 18px rgba(128, 90, 213, 0.35)"
            : "0 0 0px rgba(128, 90, 213, 0)",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="flex items-center gap-3">
          <div className="relative w-full">
            {suggestion && (
              <span className="absolute left-3 top-2 text-white/20 pointer-events-none select-none">
                {suggestion}
              </span>
            )}
            <Input
              className={`flex-1 text-base ${isSilentIdle ? "prime-input-silent" : ""}`}
              value={input}
              placeholder="Issue command..."
              onChange={(e) => {
                const value = e.target.value;
                setInput(value);
                if (value.startsWith("/")) {
                  const match = commandList.find(cmd =>
                    cmd.startsWith(value.slice(1))
                  );
                  setSuggestion(match ? `/${match}` : "");
                } else {
                  setSuggestion("");
                }
                const now = Date.now();
                setLastInputTime(now);
                setIsSilentIdle(false);
                setNeuralState((current) => current === "idle" ? null : current);
              }}
              onKeyDown={(e) => {
                if (e.key === "Tab" && suggestion) {
                  e.preventDefault();
                  setInput(suggestion);
                  setSuggestion("");
                }
                if (e.key === "Enter") {
                  handleSend();
                  setSuggestion("");
                }
              }}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
          </div>
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
