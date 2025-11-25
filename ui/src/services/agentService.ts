/**
 * Agent Service
 * API client for agent operations
 */

import { AgentManifest, AgentStatus, GenesisResult, GenesisStatus } from "../features/agents/types/agentManifest";

const BASE_URL = (window as any).getApiBase?.() || (window as any).SAGE_API_BASE || '/api';

/**
 * Simple fetch wrapper that uses the configured API base
 */
async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/**
 * Check if running in local dev mode
 */
function isLocalDev(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost' &&
    (window.location.port === '5173' || window.location.port === '3000')
  );
}

/**
 * Create a new agent from a manifest
 */
export async function createAgent(manifest: AgentManifest): Promise<GenesisResult> {
  if (isLocalDev()) {
    // Mock response for local development
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          genesisId: `genesis-${Date.now()}`,
          status: "validating",
          message: "Agent creation initiated (mock)",
        });
      }, 500);
    });
  }

  try {
    const response = await apiFetch('/agents/genesis', {
      method: 'POST',
      body: JSON.stringify(manifest),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      genesisId: data.genesisId || `genesis-${Date.now()}`,
      status: data.status || "validating",
      agentId: data.agentId,
      message: data.message,
    };
  } catch (error) {
    console.error('Error creating agent:', error);
    throw error;
  }
}

/**
 * Forge an agent (initiate the forging process)
 */
export async function forgeAgent(agentId: string): Promise<GenesisResult> {
  if (isLocalDev()) {
    // Mock response for local development
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          genesisId: `genesis-${Date.now()}`,
          status: "forging",
          agentId,
          message: "Agent forging initiated (mock)",
        });
      }, 300);
    });
  }

  try {
    const response = await apiFetch(`/agents/${agentId}/forge`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      genesisId: data.genesisId || `genesis-${Date.now()}`,
      status: data.status || "forging",
      agentId,
      message: data.message,
    };
  } catch (error) {
    console.error('Error forging agent:', error);
    throw error;
  }
}

/**
 * Get the status of an agent
 */
export async function getAgentStatus(agentId: string): Promise<AgentStatus> {
  if (isLocalDev()) {
    // Mock response for local development
    return {
      id: agentId,
      name: `agent-${agentId}`,
      class: "researcher",
      capabilities: ["analyze", "monitor"],
      status: "active",
      createdAt: new Date().toISOString(),
    };
  }

  try {
    const response = await apiFetch(`/agents/${agentId}/status`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data as AgentStatus;
  } catch (error) {
    console.error('Error getting agent status:', error);
    throw error;
  }
}

/**
 * List all agents
 */
export async function listAgents(): Promise<AgentStatus[]> {
  if (isLocalDev()) {
    // Mock response for local development
    return [
      {
        id: 'sage-core',
        name: 'SAGE Core',
        class: 'researcher',
        capabilities: ['analyze', 'monitor', 'stream'],
        status: 'active',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'whisperer',
        name: 'Whisperer',
        class: 'watcher',
        capabilities: ['ingest', 'analyze', 'respond'],
        status: 'active',
        createdAt: new Date(Date.now() - 43200000).toISOString(),
      },
    ];
  }

  try {
    const response = await apiFetch('/agents');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : (data.agents || []);
  } catch (error) {
    console.error('Error listing agents:', error);
    return [];
  }
}

/**
 * Get genesis status by genesis ID
 */
export async function getGenesisStatus(genesisId: string): Promise<GenesisStatus> {
  if (isLocalDev()) {
    // Mock response for local development
    return {
      genesisId,
      status: "forging",
      progress: 50,
      message: "Forging in progress (mock)",
    };
  }

  try {
    const response = await apiFetch(`/agents/genesis/${genesisId}/status`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data as GenesisStatus;
  } catch (error) {
    console.error('Error getting genesis status:', error);
    throw error;
  }
}

