export type TelemetryCategory =
  | "ALL"
  | "SYSTEM"
  | "ARC"
  | "RHO2"
  | "FEDERATION"
  | "AGENT"
  | "WHISPERER"
  | "ERROR"
  | "DEBUG"
  | "HEARTBEAT";

export interface TelemetryEvent {
  category: TelemetryCategory;
  message: string;
  timestamp: number;
  raw: any;
}

