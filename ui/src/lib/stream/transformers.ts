/**
 * Signal Refinement Transformers
 * Phase P-10: Transforms raw events into meaningful signal intelligence
 */

export interface RawEvent {
  type: string;
  signal: string;
  source: string;
  timestamp: number;
  payload?: any;
  [key: string]: any;
}

export interface SignalMessage {
  id: string;
  timestamp: number;
  type: string;
  signal: string;
  source: string;
  message: string;
  color: string;
  icon: string;
  isSignificant: boolean;
}

// Track last seen values for suppression
const lastHeartbeat = { timestamp: 0, count: 0 };
const lastAgentStates = new Map<string, string>();
const lastArcSync = { timestamp: 0 };
const lastRho2Signal = { timestamp: 0, type: "" };
const lastConnectionState = { state: "", timestamp: 0 };

/**
 * Suppress repetitive heartbeat ticks (only show every 5th or on significant change)
 */
function shouldSuppressHeartbeat(event: RawEvent): boolean {
  const now = Date.now();
  const timeSinceLast = now - lastHeartbeat.timestamp;
  
  // Show first heartbeat, then suppress if within 20 seconds
  if (timeSinceLast < 20000) {
    lastHeartbeat.count++;
    // Only show every 5th heartbeat or if payload changed significantly
    if (lastHeartbeat.count % 5 !== 0) {
      return true;
    }
  } else {
    lastHeartbeat.timestamp = now;
    lastHeartbeat.count = 1;
  }
  
  return false;
}

/**
 * Check if agent state actually changed
 */
function isAgentStateChange(event: RawEvent): boolean {
  const agentId = event.payload?.agent || event.source;
  const newState = event.payload?.state || "unknown";
  const lastState = lastAgentStates.get(agentId);
  
  if (lastState !== newState) {
    lastAgentStates.set(agentId, newState);
    return true;
  }
  
  return false;
}

/**
 * Check if ARC sync event is significant
 */
function isSignificantArcEvent(event: RawEvent): boolean {
  const now = Date.now();
  const timeSinceLast = now - lastArcSync.timestamp;
  
  // Suppress if same type within 10 seconds
  if (timeSinceLast < 10000 && event.signal === "ARC_SYNC") {
    return false;
  }
  
  lastArcSync.timestamp = now;
  return true;
}

/**
 * Check if Rho² signal is an anomaly
 */
function isRho2Anomaly(event: RawEvent): boolean {
  const now = Date.now();
  const signalType = event.payload?.type || event.signal;
  
  // Track frequency - if too frequent, might be anomaly
  if (event.signal === "RHO2_SIGNAL") {
    const timeSinceLast = now - lastRho2Signal.timestamp;
    if (timeSinceLast < 5000 && lastRho2Signal.type === signalType) {
      return true; // Rapid repeated signals = anomaly
    }
    lastRho2Signal.timestamp = now;
    lastRho2Signal.type = signalType;
  }
  
  // Check payload for anomaly indicators
  if (event.payload?.anomaly || event.payload?.error || event.payload?.warning) {
    return true;
  }
  
  return false;
}

/**
 * Check if connection lifecycle event is significant
 */
function isConnectionLifecycle(event: RawEvent): boolean {
  const state = event.signal === "CONNECTED" ? "connected" : 
                event.signal === "DISCONNECTED" ? "disconnected" : "";
  
  if (!state) return false;
  
  const now = Date.now();
  const lastState = lastConnectionState.state;
  
  // Only show if state actually changed
  if (lastState !== state) {
    lastConnectionState.state = state;
    lastConnectionState.timestamp = now;
    return true;
  }
  
  return false;
}

/**
 * Determine if event should be shown in signal stream
 */
export function shouldShowInSignalStream(event: RawEvent): boolean {
  // Always show status transitions
  if (event.signal === "STATUS_TRANSITION" || event.type === "STATUS_CHANGE") {
    return true;
  }
  
  // Suppress repetitive heartbeats
  if (event.signal === "HEARTBEAT_TICK") {
    return !shouldSuppressHeartbeat(event);
  }
  
  // Show agent state changes only
  if (event.signal === "AGENT_STATUS") {
    return isAgentStateChange(event);
  }
  
  // Show significant ARC events
  if (event.signal === "ARC_EVENT" || event.signal === "ARC_SYNC") {
    return isSignificantArcEvent(event);
  }
  
  // Show Rho² anomalies
  if (event.signal === "RHO2_SIGNAL") {
    return isRho2Anomaly(event);
  }
  
  // Show connection lifecycle
  if (event.signal === "CONNECTED" || event.signal === "DISCONNECTED") {
    return isConnectionLifecycle(event);
  }
  
  // Default: show if it's not a known repetitive type
  return true;
}

/**
 * Transform raw event into formatted signal message
 */
export function transformToSignalMessage(event: RawEvent): SignalMessage {
  const id = `${event.timestamp}-${Math.random()}`;
  const timestamp = event.timestamp || Date.now();
  
  let message = "";
  let color = "text-slate-300";
  let icon = "⚡";
  let isSignificant = false;
  
  switch (event.signal) {
    case "HEARTBEAT_TICK":
      message = `Heartbeat | ${event.source} | load: ${event.payload?.load?.toFixed(1) || "N/A"}%`;
      color = "text-blue-400";
      icon = "♥";
      break;
      
    case "AGENT_STATUS":
      const agent = event.payload?.agent || event.source;
      const state = event.payload?.state || "unknown";
      message = `Agent ${agent} → ${state}`;
      color = state === "active" ? "text-green-400" : "text-yellow-400";
      icon = "🤖";
      isSignificant = true;
      break;
      
    case "ARC_EVENT":
    case "ARC_SYNC":
      const arcType = event.payload?.type || "sync";
      message = `ARC ${arcType} | ${event.source}`;
      color = "text-cyan-400";
      icon = "⚡";
      isSignificant = true;
      break;
      
    case "RHO2_SIGNAL":
      const rho2Type = event.payload?.type || "signal";
      const isAnomaly = event.payload?.anomaly || event.payload?.error;
      message = `${isAnomaly ? "⚠️ " : ""}Rho² ${rho2Type} | ${event.source}`;
      color = isAnomaly ? "text-red-400" : "text-purple-400";
      icon = "🌊";
      isSignificant = isAnomaly;
      break;
      
    case "CONNECTED":
      message = `Connected | ${event.source}`;
      color = "text-green-400";
      icon = "🔗";
      isSignificant = true;
      break;
      
    case "DISCONNECTED":
      message = `Disconnected | ${event.source}`;
      color = "text-red-400";
      icon = "🔌";
      isSignificant = true;
      break;
      
    case "STATUS_TRANSITION":
      message = `Status: ${event.payload?.from || "?"} → ${event.payload?.to || "?"}`;
      color = "text-yellow-400";
      icon = "🔄";
      isSignificant = true;
      break;
      
    default:
      message = `${event.signal} | ${event.source}`;
      color = "text-slate-400";
      icon = "📡";
  }
  
  return {
    id,
    timestamp,
    type: event.type || "UNKNOWN",
    signal: event.signal,
    source: event.source,
    message,
    color,
    icon,
    isSignificant,
  };
}

