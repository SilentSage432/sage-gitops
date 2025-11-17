import { apiFetch } from '../utils/apiClient';

type SystemStatus = {
  status: 'online' | 'offline' | 'warning' | 'error';
  uptime: string;
  cpu: number;
  memory: number;
  network: number;
};

type AgentStatus = {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
};

type PanelDescriptor = {
  id: string;
  label: string;
  path: string;
};

function isLocalDev(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost' &&
    window.location.port === '5173'
  );
}

class WhispererService {
  // /status
  async getSystemStatus(): Promise<SystemStatus> {
    if (isLocalDev()) {
      return {
        status: 'online',
        uptime: 'dev-session',
        cpu: 5,
        memory: 12,
        network: 1,
      };
    }

    try {
      const response = await apiFetch('status', { method: 'GET' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json().catch(() => ({} as any));

      return {
        status: (data.status as SystemStatus['status']) || 'online',
        uptime: data.uptime || 'unknown',
        cpu: typeof data.cpu === 'number' ? data.cpu : 0,
        memory: typeof data.memory === 'number' ? data.memory : 0,
        network: typeof data.network === 'number' ? data.network : 0,
      };
    } catch {
      return {
        status: 'warning',
        uptime: 'fallback',
        cpu: 0,
        memory: 0,
        network: 0,
      };
    }
  }

  // /agents
  async listAgents(): Promise<AgentStatus[]> {
    if (isLocalDev()) {
      return [
        { id: 'sage-core', name: 'SAGE Core', status: 'active' },
        { id: 'whisperer', name: 'Whisperer', status: 'active' },
        { id: 'lifecycle', name: 'Lifecycle Orchestrator', status: 'active' },
      ];
    }

    try {
      const res = await apiFetch('agents', { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as AgentStatus[];
      if (!Array.isArray(data)) throw new Error('bad agents payload');
      return data;
    } catch {
      return [
        { id: 'sage-core', name: 'SAGE Core', status: 'active' },
        { id: 'whisperer', name: 'Whisperer', status: 'active' },
      ];
    }
  }

  // Used by TerminalContext
  async getPanelList(): Promise<PanelDescriptor[]> {
    return [
      { id: 'whisperer', label: 'Whisperer', path: '/ui/whisperer' },
      { id: 'vitals', label: 'Mesh Vitals', path: '/ui/vitals' },
      { id: 'lifecycle', label: 'Lifecycle', path: '/ui/lifecycle' },
      { id: 'signals', label: 'Signals', path: '/ui/signals' },
      { id: 'governance', label: 'Governance', path: '/ui/settings' },
      { id: 'godview', label: 'GodView / Mappings', path: '/ui/godview' },
    ];
  }

  // Main handler for / commands
  async handleCommand(input: string): Promise<string> {
    const trimmed = input.trim();
    if (!trimmed) return '';

    if (!trimmed.startsWith('/')) {
      return `You said: ${trimmed}`;
    }

    switch (trimmed) {
      case '/help':
        return [
          'Available commands:',
          '/status   - Show system status',
          '/agents   - List known agents',
          '/vitals   - Hint: open Mesh Vitals console',
          '/signals  - Hint: open Signals console',
          '/settings - Hint: open Governance console',
          '/clear    - Clear the terminal',
        ].join('\n');

      case '/status': {
        const status = await this.getSystemStatus();
        return [
          `System Status: ${status.status.toUpperCase()}`,
          `Uptime: ${status.uptime}`,
          `CPU: ${status.cpu}%`,
          `Memory: ${status.memory}%`,
          `Network: ${status.network}%`,
        ].join('\n');
      }

      case '/agents': {
        const agents = await this.listAgents();
        return agents
          .map(
            (a) =>
              `- ${a.name} [${a.id}]: ${a.status.toUpperCase()}`
          )
          .join('\n');
      }

      case '/vitals':
        return 'Open Mesh Vitals from the sidebar to inspect federation health.';

      case '/signals':
        return 'Open Signals from the sidebar to view anomalies and events.';

      case '/settings':
        return 'Open Governance from the sidebar to adjust policies and guardrails.';

      case '/clear':
        return '';

      default:
        return `Unknown command: ${trimmed}\nType /help for available commands.`;
    }
  }
}

export const whispererService = new WhispererService();
