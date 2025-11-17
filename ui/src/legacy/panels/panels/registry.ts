export type ConsoleId =
  | 'whisperer'
  | 'vitals'
  | 'lifecycle'
  | 'signals'
  | 'governance'
  | 'godview'
  | 'mappings';

export interface ConsoleDefinition {
  id: ConsoleId;
  label: string;
  path: string;          // base route path
  description?: string;
  category?: 'core' | 'observability' | 'governance' | 'lab';
  icon?: string;         // optional: used by Layout/nav if desired
  legacy?: boolean;      // mark relics explicitly instead of hiding intent
}

/**
 * SAGE Enterprise Cockpit Registry
 *
 * Single source of truth for what appears in the operator UI.
 */
export const CONSOLES: ConsoleDefinition[] = [
  {
    id: 'whisperer',
    label: 'Whisperer',
    path: '/ui/whisperer',
    description: 'Primary console to converse with and direct SAGE.',
    category: 'core',
    icon: 'terminal',
  },
  {
    id: 'vitals',
    label: 'Mesh Vitals',
    path: '/ui/vitals',
    description: 'Federation, cluster, and service health overview.',
    category: 'observability',
    icon: 'activity',
  },
  {
    id: 'lifecycle',
    label: 'Lifecycle',
    path: '/ui/lifecycle',
    description: 'Agents, deployments, rollout and orchestration controls.',
    category: 'core',
    icon: 'layers',
  },
  {
    id: 'signals',
    label: 'Signals',
    path: '/ui/signals',
    description: 'Forecasts, anomalies, and notable events across the mesh.',
    category: 'observability',
    icon: 'radar',
  },
  {
    id: 'governance',
    label: 'Governance',
    path: '/ui/settings',
    description: 'Policies, guardrails, capabilities, and operator settings.',
    category: 'governance',
    icon: 'shield',
  },
  {
    id: 'godview',
    label: 'GodView',
    path: '/ui/godview',
    description: 'Genesis / deep system view of SAGE.',
    category: 'lab',
    icon: 'eye',
  },
  {
    id: 'mappings',
    label: 'Mappings Console',
    path: '/ui/mappings',
    description: 'Legacy mappings console preserved as a first-class tool.',
    category: 'lab',
    icon: 'map',
    legacy: true,
  },
];

export function getConsoles(): ConsoleDefinition[] {
  return CONSOLES;
}

export function findConsoleByPath(path: string): ConsoleDefinition | undefined {
  return CONSOLES.find((c) => path.startsWith(c.path));
}

// Default export for any legacy imports
export default CONSOLES;
