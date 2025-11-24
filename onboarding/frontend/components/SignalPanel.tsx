"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "./ui/badge";

type ViewMode = "RAW" | "SIGNAL" | "HYBRID";

interface RawEvent {
  type: string;
  signal: string;
  source: string;
  timestamp: number;
  payload: Record<string, any>;
}

interface SignalMessage {
  id: string;
  signal: string;
  message: string;
  icon: string;
  color: string;
  timestamp: number;
  source: string;
  isSignificant: boolean;
}

export function SignalPanel() {
  const [viewMode, setViewMode] = useState<ViewMode>("HYBRID");
  const [rawEvents, setRawEvents] = useState<RawEvent[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  // Mock event stream
  useEffect(() => {
    const eventTypes = [
      { signal: "HEARTBEAT_TICK", type: "FEDERATION_EVENT", source: "arc-bridge-local" },
      { signal: "AGENT_STATUS", type: "FEDERATION_EVENT", source: "agent-orchestrator" },
      { signal: "ARC_EVENT", type: "FEDERATION_EVENT", source: "arc-core" },
      { signal: "RHO2_SIGNAL", type: "FEDERATION_EVENT", source: "rho2-bus" },
    ];

    const generateEvent = () => {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const now = Date.now();
      
      const rawEvent: RawEvent = {
        type: eventType.type,
        signal: eventType.signal,
        source: eventType.source,
        timestamp: now,
        payload: {},
      };
      
      setRawEvents((prev) => {
        const updated = [...prev, rawEvent];
        if (updated.length > 150) {
          return updated.slice(-150);
        }
        return updated;
      });
    };

    const scheduleNext = () => {
      const delay = 3000 + Math.random() * 3000;
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

  // Transform raw events to signal messages
  const signalMessages: SignalMessage[] = rawEvents
    .filter((e) => e.signal !== "HEARTBEAT_TICK")
    .map((event, idx) => ({
      id: `${event.timestamp}-${idx}`,
      signal: event.signal,
      message: `${event.signal} from ${event.source}`,
      icon: "📡",
      color: "text-purple-300",
      timestamp: event.timestamp,
      source: event.source,
      isSignificant: Math.random() > 0.7,
    }));

  // Auto-scroll
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

  // Track user scroll
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* View Mode Selector - Fixed at top, no overflow */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-white/60 whitespace-nowrap">View:</span>
          {(["RAW", "SIGNAL", "HYBRID"] as ViewMode[]).map((mode) => (
            <Badge
              key={mode}
              variant={viewMode === mode ? "default" : "outline"}
              className={`cursor-pointer whitespace-nowrap ${
                viewMode === mode ? "bg-[#6366f1]" : ""
              }`}
              onClick={() => setViewMode(mode)}
            >
              {mode}
            </Badge>
          ))}
        </div>
      </div>

      {/* Stream Viewport - Scrollable, with padding and grid background */}
      <div
        ref={logRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 font-mono text-sm"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        }}
      >
        {viewMode === "RAW" && (
          <div className="space-y-2">
            {rawEvents.length === 0 ? (
              <div className="text-white/40 text-center py-8">No raw events</div>
            ) : (
              rawEvents.map((event, idx) => {
                const totalEvents = rawEvents.length;
                const ageIndex = totalEvents - idx - 1;
                let opacity = 0.9;
                if (ageIndex >= 2) opacity = 0.6;
                if (ageIndex >= 4) opacity = 0.35;

                return (
                  <div
                    key={`${event.timestamp}-${idx}`}
                    className="p-2 bg-white/5 rounded border-l border-white/20"
                    style={{ opacity }}
                  >
                    <pre className="text-white/80 text-xs whitespace-pre-wrap break-words">
                      {JSON.stringify(event, null, 2)}
                    </pre>
                  </div>
                );
              })
            )}
          </div>
        )}

        {viewMode === "SIGNAL" && (
          <div className="space-y-2">
            {signalMessages.length === 0 ? (
              <div className="text-white/40 text-center py-8">No signal intelligence available</div>
            ) : (
              signalMessages.map((signal, idx) => {
                const totalMessages = signalMessages.length;
                const ageIndex = totalMessages - idx - 1;
                let opacity = 0.9;
                if (ageIndex >= 2) opacity = 0.6;
                if (ageIndex >= 4) opacity = 0.35;

                return (
                  <div
                    key={signal.id}
                    className={`p-2 rounded-lg border-l-2 ${
                      signal.isSignificant
                        ? "bg-white/10 border-[#6366f1]"
                        : "bg-white/5 border-white/20"
                    }`}
                    style={{ opacity }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{signal.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs ${signal.color} font-semibold`}>
                            {signal.signal}
                          </span>
                          <span className="text-xs text-white/40">
                            {new Date(signal.timestamp).toLocaleTimeString()}
                          </span>
                          {signal.isSignificant && (
                            <span className="text-xs bg-[#6366f1]/20 text-[#6366f1] px-1.5 py-0.5 rounded">
                              SIGNIFICANT
                            </span>
                          )}
                        </div>
                        <div className={`${signal.color} text-sm break-words`}>
                          {signal.message}
                        </div>
                        <div className="text-xs text-white/40 mt-1">
                          {signal.source}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {viewMode === "HYBRID" && (
          <div className="space-y-3">
            {signalMessages.length === 0 ? (
              <div className="text-white/40 text-center py-8">No signal intelligence available</div>
            ) : (
              signalMessages.map((signal, idx) => {
                const rawEvent = rawEvents.find((e) => e.timestamp === signal.timestamp);
                const totalMessages = signalMessages.length;
                const ageIndex = totalMessages - idx - 1;
                let opacity = 0.9;
                if (ageIndex >= 2) opacity = 0.6;
                if (ageIndex >= 4) opacity = 0.35;

                return (
                  <div
                    key={signal.id}
                    className={`p-3 rounded-lg border-l-2 ${
                      signal.isSignificant
                        ? "bg-white/10 border-[#6366f1]"
                        : "bg-white/5 border-white/20"
                    }`}
                    style={{ opacity }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{signal.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs ${signal.color} font-semibold`}>
                            {signal.signal}
                          </span>
                          <span className="text-xs text-white/40">
                            {new Date(signal.timestamp).toLocaleTimeString()}
                          </span>
                          {signal.isSignificant && (
                            <span className="text-xs bg-[#6366f1]/20 text-[#6366f1] px-1.5 py-0.5 rounded">
                              SIGNIFICANT
                            </span>
                          )}
                        </div>
                        <div className={`${signal.color} text-sm break-words`}>
                          {signal.message}
                        </div>
                        <div className="text-xs text-white/40 mt-1">
                          {signal.source}
                        </div>
                      </div>
                    </div>
                    {rawEvent && (
                      <div className="mt-2 pt-2 border-t border-white/10 opacity-20 hover:opacity-40 transition-opacity">
                        <pre className="text-white/40 text-xs whitespace-pre-wrap break-words">
                          {JSON.stringify(rawEvent, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

