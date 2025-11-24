import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion } from "framer-motion";

import "./OperatorTerminal.css";
import {
  TelemetryFilter,
  useTelemetryFilter,
} from "../../core/filters/useTelemetryFilter";
import { useOperatorMemory } from "../../core/OperatorMemoryContext";
import { routeCommand } from "../../sage/commandRouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RawEvent, shouldShowInSignalStream, transformToSignalMessage } from "../../lib/stream/transformers";

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

const MAX_RAW_EVENTS = 150;

type ViewMode = "RAW" | "SIGNAL" | "HYBRID";

export default function OperatorTerminal() {
  const { activeFilter, setActiveFilter } = useTelemetryFilter();
  const { remember, recallRecent } = useOperatorMemory();

  const [viewMode, setViewMode] = useState<ViewMode>("HYBRID");
  
  // Raw events with full JSON (capped at 150)
  const [rawEvents, setRawEvents] = useState<RawEvent[]>([]);
  
  // Legacy log for commands and responses
  const [log, setLog] = useState<
    { text?: string; message?: string; category: LogCategory; ts: number; isCommand?: boolean }[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [isJustActivated, setIsJustActivated] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(Date.now());
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

  // Mock event stream for live telemetry - Phase P-10: Generate raw events with full JSON
  useEffect(() => {
    const eventTypes = [
      { signal: "HEARTBEAT_TICK", type: "FEDERATION_EVENT", source: "arc-bridge-local" },
      { signal: "AGENT_STATUS", type: "FEDERATION_EVENT", source: "agent-orchestrator" },
      { signal: "ARC_EVENT", type: "FEDERATION_EVENT", source: "arc-core" },
      { signal: "ARC_SYNC", type: "FEDERATION_EVENT", source: "arc-core" },
      { signal: "RHO2_SIGNAL", type: "FEDERATION_EVENT", source: "rho2-bus" },
      { signal: "CONNECTED", type: "FEDERATION_EVENT", source: "federation-gateway" },
      { signal: "STATUS_TRANSITION", type: "FEDERATION_EVENT", source: "system" },
    ];

    const generateEvent = () => {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const now = Date.now();
      
      // Create full JSON event
      const rawEvent: RawEvent = {
        type: eventType.type,
        signal: eventType.signal,
        source: eventType.source,
        timestamp: now,
        payload: {},
      };
      
      // Add payload based on signal type
      switch (eventType.signal) {
        case "HEARTBEAT_TICK":
          rawEvent.payload = {
            load: Math.random() * 100,
            uptime: performance.now() / 1000,
          };
          break;
        case "AGENT_STATUS":
          const agents = ["alpha", "beta", "gamma"];
          const agent = agents[Math.floor(Math.random() * agents.length)];
          rawEvent.payload = {
            agent,
            state: Math.random() > 0.5 ? "active" : "idle",
          };
          break;
        case "ARC_EVENT":
        case "ARC_SYNC":
          rawEvent.payload = {
            type: Math.random() > 0.5 ? "pulse" : "sync",
          };
          break;
        case "RHO2_SIGNAL":
          rawEvent.payload = {
            type: "signal",
            freq: Math.random() * 1000,
            anomaly: Math.random() > 0.9, // 10% chance of anomaly
          };
          break;
        case "CONNECTED":
          rawEvent.payload = {
            handshake: "complete",
          };
          break;
        case "STATUS_TRANSITION":
          rawEvent.payload = {
            from: "idle",
            to: "active",
          };
          break;
      }

      // Add to raw events with buffer cap
      setRawEvents((prev) => {
        const updated = [...prev, rawEvent];
        // Auto-trim when limit reached
        if (updated.length > MAX_RAW_EVENTS) {
          return updated.slice(-MAX_RAW_EVENTS);
        }
        return updated;
      });
      
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
  
  // Process raw events into signal stream
  const signalMessages = useMemo(() => {
    return rawEvents
      .filter(shouldShowInSignalStream)
      .map(transformToSignalMessage);
  }, [rawEvents]);
  
  // Create map of signal message IDs to raw events for HYBRID mode
  const signalToRawMap = useMemo(() => {
    const map = new Map<string, RawEvent>();
    rawEvents.forEach(event => {
      if (shouldShowInSignalStream(event)) {
        const signal = transformToSignalMessage(event);
        map.set(signal.id, event);
      }
    });
    return map;
  }, [rawEvents]);

  function normalizeCategory(value?: string): LogCategory {
    const upper = (value || "SYSTEM").toUpperCase() as TelemetryFilter;
    if (upper === "ALL") return "SYSTEM";
    if (CATEGORY_SET.has(upper as LogCategory)) {
      return upper as LogCategory;
    }
    return "SYSTEM";
  }

  const handleSend = useCallback(async (command: string) => {
    if (!command.trim()) return;
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
  }, [remember]);

  const filteredLog = useMemo(() => {
    const filtered = activeFilter === "ALL" 
      ? log 
      : log.filter((entry) => entry.category === activeFilter);
    console.log("Filtered log:", { activeFilter, totalLog: log.length, filteredCount: filtered.length, filtered });
    return filtered;
  }, [activeFilter, log]);
  
  // Listen for global command events
  useEffect(() => {
    const handleGlobalCommand = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { command } = customEvent.detail || {};
      if (command) {
        await handleSend(command);
      }
    };

    window.addEventListener("OPERATOR_COMMAND", handleGlobalCommand);
    return () => window.removeEventListener("OPERATOR_COMMAND", handleGlobalCommand);
  }, [handleSend]);

  // Auto-scroll for telemetry viewport (all modes)
  useEffect(() => {
    if (logRef.current && !userScrolledRef.current) {
      setTimeout(() => {
        if (logRef.current && !userScrolledRef.current) {
          logRef.current.scrollTo({
            top: logRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 50);
    }
  }, [rawEvents, signalMessages, viewMode]);

  return (
    <Card id="operator-terminal" className={`prime-terminal-aura prime-terminal-panel ${isIdle ? "prime-terminal-idle" : isJustActivated ? "prime-terminal-activated" : "prime-terminal-active"} ${isSilentIdle ? "prime-silent-idle" : ""} ${isPreResponse ? "prime-pre-response" : ""}`} style={{ position: "relative" }}>
      {/* Neural Presence Overlay */}
      <div className={`prime-neural-overlay ${neuralState ? `prime-state-${neuralState}` : ""}`} />
      
      {/* View Mode Filter Bar - Phase P-10 */}
      <div className="terminal-filter-bar mb-2" style={{ position: "relative", zIndex: 10, paddingTop: "12px", paddingLeft: "12px", paddingRight: "12px" }}>
        <div className="telemetry-mode-toggle">
          <span className="text-xs text-slate-400 whitespace-nowrap">View:</span>
          {(["RAW", "SIGNAL", "HYBRID"] as ViewMode[]).map((mode) => (
            <Badge
              key={mode}
              variant={viewMode === mode ? "default" : "outline"}
              className={`cursor-pointer whitespace-nowrap ${
                viewMode === mode ? "bg-purple-600" : ""
              }`}
              onClick={() => setViewMode(mode)}
            >
              {mode}
            </Badge>
          ))}
        </div>
      </div>
      
      {/* Legacy Filter Bar (for commands/responses) */}
      <div className="terminal-filter-bar" style={{ position: "relative", zIndex: 10, paddingLeft: "12px", paddingRight: "12px", paddingBottom: "8px", display: "flex", flexWrap: "wrap", gap: "6px", overflowX: "auto" }}>
        {FILTERS.map((cat) => (
          <Badge
            key={cat}
            variant={activeFilter === cat ? "default" : "outline"}
            className={`terminal-filter-btn cursor-pointer whitespace-nowrap ${
              activeFilter === cat ? "on" : "off"
            }`}
            onClick={() => setActiveFilter(cat)}
          >
            {cat.toUpperCase()}
          </Badge>
        ))}
      </div>

      {/* Single Telemetry Viewport - Phase P-10 (View Mode Switch) */}
      <motion.div
        key={viewMode}
        ref={logRef}
        className={`prime-terminal-log ${hasRipple ? "prime-ripple" : ""}`}
        style={{ position: "relative", zIndex: 10 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {viewMode === "RAW" && (
          <div className="font-mono text-xs">
            {rawEvents.length === 0 ? (
              <div className="text-slate-500 text-center py-8">No raw events</div>
            ) : (
              rawEvents.map((event, idx) => {
                const totalEvents = rawEvents.length;
                const ageIndex = totalEvents - idx - 1;
                let opacity = 0.9;
                if (ageIndex >= 2) opacity = 0.6;
                if (ageIndex >= 4) opacity = 0.35;
                
                return (
                  <motion.div
                    key={`${event.timestamp}-${idx}`}
                    className="mb-2 p-2 bg-slate-900/30 rounded border-l border-slate-700"
                    style={{ opacity }}
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity, y: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <pre className="text-slate-300 whitespace-pre-wrap break-words">
                      {JSON.stringify(event, null, 2)}
                    </pre>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {viewMode === "SIGNAL" && (
          <div className="font-mono text-sm">
            {signalMessages.length === 0 ? (
              <div className="text-slate-500 text-center py-8">No signal intelligence available</div>
            ) : (
              signalMessages.map((signal, idx) => {
                const totalMessages = signalMessages.length;
                const ageIndex = totalMessages - idx - 1;
                let opacity = 0.9;
                if (ageIndex >= 2) opacity = 0.6;
                if (ageIndex >= 4) opacity = 0.35;
                
                return (
                  <motion.div
                    key={signal.id}
                    className={`mb-2 p-2 rounded-lg border-l-2 ${
                      signal.isSignificant
                        ? "bg-slate-900/50 border-purple-500"
                        : "bg-slate-900/30 border-slate-700"
                    }`}
                    style={{ opacity }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{signal.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs ${signal.color} font-semibold`}>
                            {signal.signal}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(signal.timestamp).toLocaleTimeString()}
                          </span>
                          {signal.isSignificant && (
                            <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                              SIGNIFICANT
                            </span>
                          )}
                        </div>
                        <div className={`${signal.color} text-sm break-words`}>
                          {signal.message}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {signal.source}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {viewMode === "HYBRID" && (
          <div className="font-mono text-sm">
            {signalMessages.length === 0 ? (
              <div className="text-slate-500 text-center py-8">No signal intelligence available</div>
            ) : (
              signalMessages.map((signal, idx) => {
                // Find corresponding raw event using the map
                const rawEvent = signalToRawMap.get(signal.id);
                const totalMessages = signalMessages.length;
                const ageIndex = totalMessages - idx - 1;
                let opacity = 0.9;
                if (ageIndex >= 2) opacity = 0.6;
                if (ageIndex >= 4) opacity = 0.35;
                
                return (
                  <motion.div
                    key={signal.id}
                    className={`mb-3 p-3 rounded-lg border-l-2 relative ${
                      signal.isSignificant
                        ? "bg-slate-900/50 border-purple-500"
                        : "bg-slate-900/30 border-slate-700"
                    }`}
                    style={{ opacity }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Signal message (primary) */}
                    <div className="flex items-start gap-2 relative z-10">
                      <span className="text-lg">{signal.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs ${signal.color} font-semibold`}>
                            {signal.signal}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(signal.timestamp).toLocaleTimeString()}
                          </span>
                          {signal.isSignificant && (
                            <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                              SIGNIFICANT
                            </span>
                          )}
                        </div>
                        <div className={`${signal.color} text-sm break-words`}>
                          {signal.message}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {signal.source}
                        </div>
                      </div>
                    </div>
                    {/* Raw JSON metadata overlay (low opacity) */}
                    {rawEvent && (
                      <div className="mt-2 pt-2 border-t border-slate-700/30 opacity-20 hover:opacity-40 transition-opacity">
                        <pre className="text-slate-400 text-xs whitespace-pre-wrap break-words">
                          {JSON.stringify(rawEvent, null, 2)}
                        </pre>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </motion.div>

      {/* Command/Response Log (Separate from telemetry) */}
      {filteredLog.length > 0 && (
        <motion.div
          className={`max-h-32 overflow-y-auto border-t border-slate-800 mt-2 pt-2`}
          style={{ position: "relative", zIndex: 10 }}
          initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {filteredLog.map((entry, idx) => (
          <motion.div
            key={`${entry.ts}-${idx}`}
            className={
              entry.isCommand
                  ? "prime-terminal-line prime-terminal-line-command text-sm mb-1 whitespace-pre-wrap terminal-line px-4"
                  : `prime-terminal-line prime-terminal-line-${entry.category.toLowerCase()} text-sm mb-1 whitespace-pre-wrap opacity-90 terminal-line cat-${entry.category.toLowerCase()} px-4`
            }
              initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {entry.message || entry.text}
          </motion.div>
        ))}
      </motion.div>
      )}

      {/* Jump to Live Button */}
      {showJumpToLive && (
      <motion.div
          className="absolute bottom-4 right-8 z-30"
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
    </Card>
  );
}

