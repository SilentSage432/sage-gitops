import { useEffect, useMemo, useRef, useState } from "react";
import "./OperatorTerminal.css";
import { usePulseStore } from "../../sage/state/pulseStore";

type FederationSignal =
  | "ARC_TELEMETRY"
  | "ARC_STATUS_UPDATE"
  | "AGENT_LIFECYCLE"
  | "HEARTBEAT_TICK"
  | "RHO2_SECURITY_EVENT"
  | "WHISPERER_MESSAGE"
  | "INTENT_DETECTED"
  | "OPERATOR_COMMAND"
  | "UI_ACTION"
  | "AUTONOMY_TRIGGER"
  | "SYSTEM_FAULT"
  | "SYSTEM_RESOLUTION"
  | string; // future-safe

type VitalCategory =
  | "FEDERATION"
  | "ARC_CORE"
  | "SYSTEM"
  | "AGENT"
  | "SECURITY"
  | "CRITICAL";

interface PulseEvent {
  id?: string;
  signal: FederationSignal;
  source?: string;
  timestamp?: string;
  payload?: any;
  signature?: string;
}

interface ClassifiedLine {
  id: string;
  category: VitalCategory;
  label: string;
  message: string;
  timestamp?: string;
}

function classifyEvent(evt: PulseEvent): { category: VitalCategory; label: string } {
  const signal = (evt.signal || "").toUpperCase();
  const src = (evt.source || "").toLowerCase();

  // SECURITY / CRITICAL first
  if (signal.includes("SECURITY") || signal.includes("RHO2")) {
    return { category: "SECURITY", label: "SECURITY" };
  }
  if (signal.includes("FAULT") || signal.includes("ERROR") || signal.includes("CRITICAL")) {
    return { category: "CRITICAL", label: "CRITICAL" };
  }

  // ARC core
  if (signal.includes("ARC") || ["arc-theta", "arc-sigma", "arc-omega", "arc-rho2", "arc-lambda", "arc-chi"].some(a => src.includes(a))) {
    return { category: "ARC_CORE", label: "ARC CORE" };
  }

  // Federation infra
  if (signal.includes("HEARTBEAT") || src.includes("pi") || src.includes("cluster") || src.includes("federation")) {
    return { category: "FEDERATION", label: "FEDERATION" };
  }

  // Agents
  if (signal.includes("AGENT") || src.includes("agent")) {
    return { category: "AGENT", label: "AGENT" };
  }

  // System / Whisperer / Autonomy / Intent
  if (
    signal.includes("SYSTEM") ||
    signal.includes("WHISPERER") ||
    signal.includes("INTENT") ||
    signal.includes("AUTONOMY")
  ) {
    return { category: "SYSTEM", label: "SYSTEM" };
  }

  // Default to SYSTEM if unsure (keeps it visible but calm)
  return { category: "SYSTEM", label: "SYSTEM" };
}

function isVital(evt: PulseEvent): boolean {
  // Only allow high-value stuff into the Operator Deck
  const signal = (evt.signal || "").toUpperCase();

  if (signal.includes("SYSTEM_FAULT") || signal.includes("SYSTEM_RESOLUTION")) return true;
  if (signal.includes("RHO2") || signal.includes("SECURITY")) return true;
  if (signal.includes("AUTONOMY_TRIGGER")) return true;
  if (signal.includes("OPERATOR_COMMAND")) return true;

  // Selected ARC + Federation events
  if (signal.includes("ARC_STATUS_UPDATE") || signal.includes("ARC_TELEMETRY")) return true;

  // Heartbeats are usually noise; keep them out by default
  if (signal.includes("HEARTBEAT_TICK")) return false;

  return false;
}

function formatMessage(evt: PulseEvent): string {
  const src = evt.source ? evt.source : "unknown-source";
  const base = `[${evt.signal}] from ${src}`;

  if (evt.payload && typeof evt.payload === "object") {
    // pull out a meaningful summary if possible
    if (evt.payload.message) return `${base} — ${evt.payload.message}`;
    if (evt.payload.status) return `${base} — status: ${evt.payload.status}`;
    if (evt.payload.detail) return `${base} — ${evt.payload.detail}`;
  }

  return base;
}

function getCategoryClasses(category: VitalCategory): string {
  // Cosmic but still enterprise — Tailwind-friendly
  switch (category) {
    case "SECURITY":
      return "border-pink-500/80 text-pink-200";
    case "CRITICAL":
      return "border-red-500/80 text-red-200";
    case "ARC_CORE":
      return "border-violet-500/80 text-violet-200";
    case "FEDERATION":
      return "border-sky-500/80 text-sky-200";
    case "AGENT":
      return "border-fuchsia-500/80 text-fuchsia-200";
    case "SYSTEM":
    default:
      return "border-cyan-500/60 text-cyan-200";
  }
}

export default function OperatorTerminal() {
  const [input, setInput] = useState("");
  const pulses = usePulseStore((s: any) => s.pulses || []);

  const [localLines, setLocalLines] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement | null>(null);

  const classifiedLines: ClassifiedLine[] = useMemo(() => {
    const vital = (pulses as PulseEvent[]).filter(isVital);

    return vital.map((evt, idx) => {
      const { category, label } = classifyEvent(evt);
      return {
        id: evt.id || `evt-${idx}`,
        category,
        label,
        message: formatMessage(evt),
        timestamp: evt.timestamp,
      };
    });
  }, [pulses]);

  const mergedLines = useMemo(() => {
    // Combine operator's own commands as simple lines at the end
    const local: ClassifiedLine[] = localLines.map((text, idx) => ({
      id: `cmd-${idx}`,
      category: "SYSTEM",
      label: "COMMAND",
      message: `> ${text}`,
      timestamp: undefined,
    }));

    return [...classifiedLines, ...local];
  }, [classifiedLines, localLines]);

  // Auto-scroll to bottom whenever mergedLines changes
  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [mergedLines.length]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;

    setLocalLines((prev) => [...prev, trimmed]);
    setInput("");

    try {
      await fetch("http://localhost:7070/api/whisperer/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
    } catch {
      // For now we ignore network errors in dev; they'd appear in other logs.
    }
  }

  return (
    <div className="terminal-wrapper">
      {/* Scrollable log area */}
      <div ref={logRef} className="terminal-log">
        {mergedLines.map((line) => (
          <div
            key={line.id}
            className={`mb-1 border-l-2 pl-3 text-xs tracking-tight ${getCategoryClasses(
              line.category
            )}`}
          >
            <span className="opacity-60 mr-2">{line.label}</span>
            <span>{line.message}</span>
          </div>
        ))}
      </div>

      {/* Fixed input bar at bottom */}
      <div className="terminal-input-bar">
        <input
          className="terminal-input"
          value={input}
          placeholder="Issue Federation or System command..."
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
