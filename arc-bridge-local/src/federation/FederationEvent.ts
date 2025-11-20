export type FederationSignal =
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
  | "SYSTEM_RESOLUTION";

export interface FederationEvent {
  id: string;
  signal: FederationSignal;
  timestamp: string;
  source: string;
  payload?: any;
  signature?: string; // placeholder for Rho² signing
}

export function createEvent(
  signal: FederationSignal,
  source: string,
  payload: any = {}
): FederationEvent {
  return {
    id: crypto.randomUUID(),
    signal,
    source,
    payload,
    timestamp: new Date().toISOString(),
    signature: "rho2::unsigned.local", // placeholder
  };
}

