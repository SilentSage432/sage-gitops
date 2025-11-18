export type CommandType =
  | 'SYSTEM_STATUS'
  | 'ARC_STATUS'
  | 'ARC_QUERY'
  | 'FEDERATION_QUERY'
  | 'NODE_STATUS'
  | 'RHO2_EPOCH'
  | 'HELP'
  | 'UNKNOWN';

export interface CommandRoute {
  type: CommandType;
  target?: string;
}

const normalizeInput = (input: string): string => {
  return input.trim().toLowerCase();
};

const parseArcQuery = (normalized: string): CommandRoute | null => {
  const arcMatch = normalized.match(/^arc\s+(\w+)/);
  if (arcMatch) {
    return { type: 'ARC_QUERY', target: arcMatch[1] };
  }
  if (normalized === 'arc' || normalized.startsWith('arc ')) {
    return { type: 'ARC_STATUS' };
  }
  return null;
};

const parseRho2Epoch = (normalized: string): CommandRoute | null => {
  if (normalized === 'rho2 epoch' || normalized === 'rho-2 epoch' || normalized === 'rho 2 epoch') {
    return { type: 'RHO2_EPOCH' };
  }
  return null;
};

const parseFederationQuery = (normalized: string): CommandRoute | null => {
  if (normalized === 'federation nodes' || normalized === 'federation' || normalized.startsWith('federation ')) {
    return { type: 'FEDERATION_QUERY' };
  }
  return null;
};

const parseNodeStatus = (normalized: string): CommandRoute | null => {
  if (normalized === 'nodes' || normalized === 'node status' || normalized === 'node') {
    return { type: 'NODE_STATUS' };
  }
  return null;
};

const parseSystemStatus = (normalized: string): CommandRoute | null => {
  if (normalized === 'status' || normalized === 'system status' || normalized === 'system') {
    return { type: 'SYSTEM_STATUS' };
  }
  return null;
};

const parseHelp = (normalized: string): CommandRoute | null => {
  if (normalized === 'help' || normalized === '?' || normalized === 'commands') {
    return { type: 'HELP' };
  }
  return null;
};

export const routeCommand = (input: string): CommandRoute => {
  const normalized = normalizeInput(input);

  const parsers = [
    parseHelp,
    parseRho2Epoch,
    parseArcQuery,
    parseFederationQuery,
    parseNodeStatus,
    parseSystemStatus,
  ];

  for (const parser of parsers) {
    const result = parser(normalized);
    if (result) {
      return result;
    }
  }

  return { type: 'UNKNOWN' };
};

