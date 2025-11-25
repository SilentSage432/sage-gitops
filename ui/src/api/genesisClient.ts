/**
 * Genesis Client
 * WebSocket + HTTP hybrid client for genesis events and API calls
 */

import { AgentManifest, GenesisEvent, GenesisStatus, GenesisResult } from "../features/agents/types/agentManifest";

const BASE_URL = (window as any).getApiBase?.() || (window as any).SAGE_API_BASE || '/api';
const WS_BASE_URL = (import.meta.env as any).VITE_SAGE_WS_URL || 'ws://localhost:7001';

type GenesisEventHandler = (event: GenesisEvent) => void;

class GenesisClient {
  private ws: WebSocket | null = null;
  private wsReconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private reconnectTimer: number | null = null;
  private eventHandlers: Set<GenesisEventHandler> = new Set();
  private isConnecting = false;

  /**
   * Check if running in local dev mode
   */
  private isLocalDev(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.location.hostname === 'localhost' &&
      (window.location.port === '5173' || window.location.port === '3000')
    );
  }

  /**
   * Connect to WebSocket for genesis events
   */
  private connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      const wsUrl = `${WS_BASE_URL}/federation/genesis`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.wsReconnectAttempts = 0;
        console.log('[GenesisClient] WebSocket connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Filter for genesis-related events
          if (
            data.type === "agent.genesis.status" ||
            data.type === "agent.genesis.progress" ||
            data.type === "agent.genesis.completed" ||
            data.type === "agent.genesis.failed" ||
            data.type === "federation.node.genesis"
          ) {
            const genesisEvent: GenesisEvent = {
              type: data.type,
              genesisId: data.genesisId || data.nodeId || 'unknown',
              status: data.status || 'unknown',
              progress: data.progress,
              message: data.message,
              agentId: data.agentId || data.nodeId,
              error: data.error,
              timestamp: data.timestamp || Date.now(),
            };

            // Notify all subscribers
            this.eventHandlers.forEach((handler) => {
              try {
                handler(genesisEvent);
              } catch (err) {
                console.error('[GenesisClient] Handler error:', err);
              }
            });
          }
        } catch (err) {
          console.warn('[GenesisClient] Invalid message:', err);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[GenesisClient] WebSocket error:', error);
        this.isConnecting = false;
        this.scheduleReconnect();
      };

      this.ws.onclose = () => {
        console.log('[GenesisClient] WebSocket closed');
        this.isConnecting = false;
        this.ws = null;
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('[GenesisClient] Connection error:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    if (this.wsReconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[GenesisClient] Max reconnection attempts reached');
      return;
    }

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.wsReconnectAttempts++;
      console.log(`[GenesisClient] Reconnecting (attempt ${this.wsReconnectAttempts})...`);
      this.connect();
    }, this.reconnectDelay);
  }

  /**
   * Submit a genesis plan (HTTP API)
   */
  async submitGenesisPlan(manifest: AgentManifest): Promise<GenesisResult> {
    if (this.isLocalDev()) {
      // Mock response for local development
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            genesisId: `genesis-${Date.now()}`,
            status: "validating",
            message: "Genesis plan submitted (mock)",
          });
        }, 500);
      });
    }

    try {
      const response = await fetch(`${BASE_URL}/agents/genesis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      console.error('[GenesisClient] Error submitting genesis plan:', error);
      throw error;
    }
  }

  /**
   * Get genesis status by ID (HTTP API)
   */
  async getGenesisStatus(genesisId: string): Promise<GenesisStatus> {
    if (this.isLocalDev()) {
      // Mock response for local development
      return {
        genesisId,
        status: "forging",
        progress: 50,
        message: "Forging in progress (mock)",
      };
    }

    try {
      const response = await fetch(`${BASE_URL}/agents/genesis/${genesisId}/status`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as GenesisStatus;
    } catch (error) {
      console.error('[GenesisClient] Error getting genesis status:', error);
      throw error;
    }
  }

  /**
   * Subscribe to genesis events (WebSocket)
   */
  subscribeToGenesisEvents(callback: GenesisEventHandler): () => void {
    this.eventHandlers.add(callback);

    // Auto-connect if not connected
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
    }

    // Return unsubscribe function
    return () => {
      this.eventHandlers.delete(callback);
    };
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.eventHandlers.clear();
    this.isConnecting = false;
  }
}

// Export singleton instance
export const genesisClient = new GenesisClient();

// Auto-connect on module load (optional - can be lazy)
if (typeof window !== 'undefined') {
  // Connect when first subscription is made (lazy connection)
  // genesisClient.connect();
}

