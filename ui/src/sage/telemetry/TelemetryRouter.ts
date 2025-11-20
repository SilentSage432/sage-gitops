import { TelemetryCategory, TelemetryEvent } from "./TelemetryTypes";

export function classifyTelemetry(raw: any): TelemetryEvent {
  const msg = typeof raw === "string" ? raw : JSON.stringify(raw);

  let category: TelemetryCategory = "SYSTEM";

  if (msg.includes("HEARTBEAT_TICK")) category = "HEARTBEAT";
  else if (msg.includes("RHO2")) category = "RHO2";
  else if (msg.includes("FEDERATION")) category = "FEDERATION";
  else if (msg.includes("AGENT")) category = "AGENT";
  else if (msg.includes("ARC")) category = "ARC";
  else if (msg.includes("WHISPERER")) category = "WHISPERER";
  else if (msg.includes("ERROR")) category = "ERROR";
  else if (msg.includes("DEBUG")) category = "DEBUG";

  const event: TelemetryEvent = {
    category,
    message: msg,
    timestamp: Date.now(),
    raw,
  };

  return event;
}

