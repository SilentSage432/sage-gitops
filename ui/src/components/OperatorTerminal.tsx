"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface LogEntry {
  id: string;
  timestamp: Date;
  type: "command" | "output" | "error";
  content: string;
  isStreaming?: boolean;
}

const STORAGE_KEY = "federationCommandLog";

export function OperatorTerminal() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load persisted logs on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }));
        setLogs(parsed.slice(-50)); // Keep last 50
      } catch (err) {
        console.error("Failed to load command log:", err);
      }
    }
  }, []);

  // Persist logs to localStorage
  useEffect(() => {
    if (logs.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    }
  }, [logs]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = useCallback((entry: Omit<LogEntry, "id" | "timestamp">) => {
    const newEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...entry,
    };
    setLogs((prev) => [...prev, newEntry].slice(-50));
    return newEntry.id;
  }, []);

  const addStreamingOutput = useCallback((content: string, onComplete?: () => void) => {
    const entryId = addLog({ type: "output", content: "", isStreaming: true });

    let currentIndex = 0;
    const streamInterval = setInterval(() => {
      currentIndex++;
      setLogs((prev) =>
        prev.map((log) =>
          log.id === entryId
            ? {
                ...log,
                content: content.substring(0, currentIndex),
                isStreaming: currentIndex < content.length,
              }
            : log
        )
      );

      if (currentIndex >= content.length) {
        clearInterval(streamInterval);
        setLogs((prev) =>
          prev.map((log) => (log.id === entryId ? { ...log, isStreaming: false } : log))
        );
        if (onComplete) onComplete();
      }
    }, 20); // ~50 characters per second

    return () => clearInterval(streamInterval);
  }, [addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const handleCommand = useCallback(
    async (command: string) => {
      const cmd = command.trim();
      if (!cmd) return;

      if (cmd === "clear") {
        setLogs([]);
        return;
      }

      // Add command to log
      addLog({ type: "command", content: cmd });

      // Dispatch to federation system
      window.dispatchEvent(
        new CustomEvent("OPERATOR_COMMAND", {
          detail: { command: cmd },
        })
      );

      // Simulate response (replace with actual federation routing)
      setTimeout(() => {
        addStreamingOutput(`Command received: ${cmd}`);
      }, 300);
    },
    [addLog, addStreamingOutput]
  );

  // Expose methods via window object for input component to access
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__federationCommandLog = {
        addLog,
        addStreamingOutput,
        clearLogs,
        handleCommand,
      };
      return () => {
        delete (window as any).__federationCommandLog;
      };
    }
  }, [addLog, addStreamingOutput, clearLogs, handleCommand]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="onboarding-terminal-frame h-full flex flex-col overflow-hidden">
      <div className="onboarding-terminal-header">
        <h2 className="onboarding-terminal-title">Operator Terminal</h2>
      </div>
      <div className="flex-1 overflow-auto px-6 py-4 pr-2 font-mono text-sm" ref={scrollRef}>
        {logs.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-8">
            Type a command to begin
          </p>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`flex items-start gap-2 ${
                  log.type === "command"
                    ? "text-violet-400"
                    : log.type === "error"
                    ? "text-red-400"
                    : "text-white/80"
                }`}
              >
                <span className="text-white/40 text-xs flex-shrink-0">
                  {formatTime(log.timestamp)}
                </span>
                <span className="flex-shrink-0">
                  {log.type === "command" ? "$" : log.type === "error" ? "!" : ">"}
                </span>
                <span className={log.isStreaming ? "animate-pulse" : ""}>
                  {log.content}
                </span>
                {log.isStreaming && <span className="animate-pulse">▋</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

