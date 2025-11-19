export type SageEventType =
  | "ARC_THETA_PING"
  | "ARC_SIGMA_METRIC"
  | "ARC_OMEGA_WATCH"
  | "RHO2_SHARD_ROTATION"
  | "NODE_VITALS"
  | "EPOCH_TICK"
  | "WHISPERER_NOTICE"
  | "SYSTEM_ALERT"
  | "GENERIC";

export interface SageEvent {
  type: SageEventType;
  timestamp: number;
  payload: any;
  signature: string; // Rho² signature (dev-mode fake)
}

