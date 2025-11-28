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

// Phase 15.9: Federation State Response
export interface FederationStateResponse {
  events: FederationEvent[];
  commands: Command[];
  subscriptions: Subscription[];
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

