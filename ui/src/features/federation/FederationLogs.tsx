import React, { useEffect, useState, useRef } from "react";
import { Search, ChevronDown, ArrowDown, ArrowUp } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: number;
  level: "info" | "warn" | "error" | "critical";
  node?: string;
  agent?: string;
  arc?: string;
  message: string;
}

export const FederationLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [nodeFilter, setNodeFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [arcFilter, setArcFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [timeWindow, setTimeWindow] = useState<string>("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);

  // Mock log stream
  useEffect(() => {
    const logMessages = [
      { level: "info" as const, message: "Node heartbeat received", node: "pi-01" },
      { level: "info" as const, message: "Telemetry packet processed", node: "pi-02", agent: "telemetry-agent" },
      { level: "warn" as const, message: "CPU usage above threshold", node: "pi-01", arc: "theta" },
      { level: "info" as const, message: "Mesh synchronization complete", node: "pi-03", arc: "sigma" },
      { level: "error" as const, message: "Connection timeout to node", node: "pi-02", agent: "network-agent" },
      { level: "info" as const, message: "Security scan completed", arc: "rho2", agent: "security-agent" },
      { level: "warn" as const, message: "Memory pressure detected", node: "pi-01", arc: "omega" },
      { level: "critical" as const, message: "Node unresponsive", node: "pi-02" },
      { level: "info" as const, message: "Federation health check passed", arc: "lambda" },
      { level: "error" as const, message: "Failed to establish mesh link", node: "pi-03", agent: "mesh-agent" },
    ];

    let messageIndex = 0;

    const generateLog = () => {
      const template = logMessages[messageIndex % logMessages.length];
      messageIndex++;

      const log: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        level: template.level,
        node: template.node,
        agent: template.agent,
        arc: template.arc,
        message: template.message,
      };

      setLogs((prev) => [...prev, log]);
    };

    // Initial log
    generateLog();

    // Generate logs every 2-4 seconds
    const interval = setInterval(() => {
      generateLog();
    }, 2000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (!autoScroll || isUserScrollingRef.current || !logContainerRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    });
  }, [logs.length, autoScroll]);

  // Detect user scrolling
  const handleScroll = () => {
    if (!logContainerRef.current) return;

    const container = logContainerRef.current;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    isUserScrollingRef.current = !isNearBottom;

    // Reset auto-scroll if user scrolls back to bottom
    if (isNearBottom && !autoScroll) {
      setAutoScroll(true);
    }
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (nodeFilter !== "all" && log.node !== nodeFilter) {
      return false;
    }
    if (agentFilter !== "all" && log.agent !== agentFilter) {
      return false;
    }
    if (arcFilter !== "all" && log.arc !== arcFilter) {
      return false;
    }
    if (levelFilter !== "all" && log.level !== levelFilter) {
      return false;
    }
    if (timeWindow !== "all") {
      const now = Date.now();
      const age = now - log.timestamp;
      switch (timeWindow) {
        case "5m":
          if (age > 5 * 60 * 1000) return false;
          break;
        case "15m":
          if (age > 15 * 60 * 1000) return false;
          break;
        case "1h":
          if (age > 60 * 60 * 1000) return false;
          break;
        case "24h":
          if (age > 24 * 60 * 60 * 1000) return false;
          break;
      }
    }
    return true;
  });

  // Get unique values for filters
  const nodes = Array.from(new Set(logs.map((l) => l.node).filter(Boolean))) as string[];
  const agents = Array.from(new Set(logs.map((l) => l.agent).filter(Boolean))) as string[];
  const arcs = Array.from(new Set(logs.map((l) => l.arc).filter(Boolean))) as string[];

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "info":
        return "text-slate-400 bg-slate-500/20 border-slate-500/30";
      case "warn":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      case "error":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      case "critical":
        return "text-purple-400 bg-purple-500/20 border-purple-500/30";
    }
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden w-full">
      {/* HEADER */}
      <div className="p-6 border-b border-slate-800 flex-shrink-0">
        <h2 className="text-2xl font-bold tracking-wide text-purple-300 mb-2">
          Federation Logs
        </h2>
        <p className="text-sm text-slate-400">
          Real-time federation log stream
        </p>
      </div>

      {/* TOOLBAR */}
      <div className="p-4 border-b border-slate-800 flex-shrink-0 space-y-3">
        {/* SEARCH */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-5 gap-2">
          {/* Node Filter */}
          <div className="relative">
            <select
              value={nodeFilter}
              onChange={(e) => setNodeFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-slate-900/60 border border-slate-700 rounded text-slate-200 text-xs appearance-none cursor-pointer focus:outline-none focus:border-purple-500/50"
            >
              <option value="all">All Nodes</option>
              {nodes.map((node) => (
                <option key={node} value={node}>
                  {node}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Agent Filter */}
          <div className="relative">
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-slate-900/60 border border-slate-700 rounded text-slate-200 text-xs appearance-none cursor-pointer focus:outline-none focus:border-purple-500/50"
            >
              <option value="all">All Agents</option>
              {agents.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Arc Filter */}
          <div className="relative">
            <select
              value={arcFilter}
              onChange={(e) => setArcFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-slate-900/60 border border-slate-700 rounded text-slate-200 text-xs appearance-none cursor-pointer focus:outline-none focus:border-purple-500/50"
            >
              <option value="all">All Arcs</option>
              {arcs.map((arc) => (
                <option key={arc} value={arc}>
                  {arc}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Level Filter */}
          <div className="relative">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-slate-900/60 border border-slate-700 rounded text-slate-200 text-xs appearance-none cursor-pointer focus:outline-none focus:border-purple-500/50"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Time Window */}
          <div className="relative">
            <select
              value={timeWindow}
              onChange={(e) => setTimeWindow(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-slate-900/60 border border-slate-700 rounded text-slate-200 text-xs appearance-none cursor-pointer focus:outline-none focus:border-purple-500/50"
            >
              <option value="all">All Time</option>
              <option value="5m">Last 5m</option>
              <option value="15m">Last 15m</option>
              <option value="1h">Last 1h</option>
              <option value="24h">Last 24h</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* LOG WINDOW */}
      <div className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Auto-scroll toggle */}
        <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-slate-400">
            {filteredLogs.length} {filteredLogs.length === 1 ? "log" : "logs"}
          </span>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-2 px-3 py-1 rounded text-xs transition ${
              autoScroll
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "bg-slate-800/60 text-slate-400 border border-slate-700 hover:bg-slate-800"
            }`}
            title={autoScroll ? "Auto-scroll enabled" : "Auto-scroll disabled"}
          >
            {autoScroll ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
            Auto-scroll
          </button>
        </div>

        {/* Scrollable log container */}
        <div
          ref={logContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto min-h-0 p-4 space-y-1 font-mono text-sm"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">No logs match filters</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-2 rounded border-l-4 ${getLevelColor(log.level)} min-w-0 overflow-hidden`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <span className="text-xs font-semibold uppercase flex-shrink-0">
                    {log.level}
                  </span>
                  <div className="flex-1 min-w-0">
                    {log.node && (
                      <span className="text-xs text-slate-400 mr-2">{log.node}</span>
                    )}
                    {log.agent && (
                      <span className="text-xs text-slate-400 mr-2">{log.agent}</span>
                    )}
                    {log.arc && (
                      <span className="text-xs text-slate-400 mr-2">{log.arc}</span>
                    )}
                    <span className="text-slate-200 break-words">{log.message}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

