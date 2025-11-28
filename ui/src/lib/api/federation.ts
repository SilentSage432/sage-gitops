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

