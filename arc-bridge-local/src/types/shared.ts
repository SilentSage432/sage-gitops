export interface WhispererMessage {
  id: string;
  role: "operator" | "system";
  text: string;
  timestamp: number;
}

export interface Rho2Status {
  shards: number;
  rotation: string;
  nextRotation: string;
}

export interface FederationNode {
  id: string;
  status: "online" | "offline";
  role: "prime" | "worker";
}

