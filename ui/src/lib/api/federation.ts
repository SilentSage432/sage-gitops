// Phase 14.7: Federation API helper
// Consumes existing backend endpoints for federation backplane data
// Use relative paths so Vite dev proxy can route them
const API_BASE_URL = '';

export interface FederationNode {
  nodeId: string;
  ts: number;
  status: string;
  lastSeen: number;
}

export interface FederationEvent {
  ts: number;
  type: string;
  nodeId: string;
  data: Record<string, unknown>;
}

export interface NodesStatusResponse {
  ts: number;
  nodes: FederationNode[];
}

export interface EventsResponse {
  events: FederationEvent[];
}

export async function fetchNodes(): Promise<NodesStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/federation/nodes/status`);
  if (!res.ok) {
    throw new Error(`Failed to fetch nodes: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchEvents(): Promise<EventsResponse> {
  const res = await fetch(`${API_BASE_URL}/federation/events`);
  if (!res.ok) {
    throw new Error(`Failed to fetch events: ${res.statusText}`);
  }
  return res.json();
}

export interface Command {
  target: string;
  cmd: string;
  data?: Record<string, unknown>;
  ts: number;
}

export interface CommandsResponse {
  commands: Command[];
}

export async function fetchCommands(): Promise<CommandsResponse> {
  const res = await fetch(`${API_BASE_URL}/federation/commands`);
  if (!res.ok) {
    throw new Error(`Failed to fetch commands: ${res.statusText}`);
  }
  return res.json();
}

// Phase 15.8: Subscription interface
export interface Subscription {
  id: string;
  channel: string;
  ts: number;
}

// Phase 16.2: Divergence Observation interface
export interface DivergenceObservation {
  intent: {
    target?: string;
    desired?: string;
    channel?: string;
    scope?: string;
    metadata?: Record<string, unknown>;
    created?: number;
    ts: number;
  };
  status: "aligned" | "missing" | "diverged";
  match?: Subscription;
  ts: number;
}

// Phase 16.7: Topology interfaces
export interface TopologyNode {
  id: string;
  type?: string;
}

export interface TopologyEdge {
  source: string;
  target?: string;
  channel: string;
  ts: number;
}

export interface FederationTopology {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

// Phase 17.2: Operator Identity interface
// Phase 73: Extended with hardware identity
export interface OperatorIdentity {
  id: string;
  source: string;
  registeredAt: number;
  lastSeen: number;
  metadata?: Record<string, unknown>;
  hardwareKey?: {
    id: string;
    publicKey: string;
    registeredAt: number;
  } | null;
}

// Phase 15.9: Federation State Response
// Phase 16.2: Extended with intents and divergence
// Phase 16.7: Extended with topology
// Phase 17.2: Extended with operator identity
export interface FederationStateResponse {
  events: FederationEvent[];
  commands: Command[];
  subscriptions: Subscription[];
  intents: Array<{
    target?: string;
    desired?: string;
    channel?: string;
    scope?: string;
    metadata?: Record<string, unknown>;
    created?: number;
    lifecycle?: string;
    staleAfter?: number;
    ts: number;
  }>;
  divergence: DivergenceObservation[];
  lifecycle: Record<string, number>;
  stale: Array<{
    intent: unknown;
    stale: boolean;
    age: number;
  }>;
  topology: FederationTopology;
  reasons: Array<{
    type: string;
    detail: string;
    severity?: string;
    context?: Record<string, unknown>;
  }>;
  operator: OperatorIdentity | null;
  ts: number;
}

// Phase 15.9: Fetch complete federation state (read-only)
export async function fetchFederationState(): Promise<FederationStateResponse> {
  const res = await fetch(`${API_BASE_URL}/federation/state`);
  if (!res.ok) {
    throw new Error(`Failed to fetch federation state: ${res.statusText}`);
  }
  return res.json();
}

