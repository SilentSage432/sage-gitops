import { MessageRole } from './messageTypes';
import { CommandRoute } from './commandRouter';

const baseDelay = 200;
const delayVariance = 100;

const formatArcName = (target?: string): string => {
  if (!target) {
    return 'ARC';
  }
  const normalized = target.toLowerCase();
  const arcMap: Record<string, string> = {
    theta: 'Θ',
    sigma: 'Σ',
    omega: 'Ω',
    lambda: 'Λ',
    chi: 'Χ',
    rho2: 'Ρ²',
    rho: 'Ρ',
  };
  return arcMap[normalized] || target.toUpperCase();
};

const buildHelpResponse = (): string => {
  return `COMMAND INDEX
———————————————————
status                system summary
arc <name>           query arc health
rho2 epoch           show epoch state
federation nodes     list federation nodes
nodes                local node status
help                 show this index`;
};

const buildArcQueryResponse = (target?: string): string => {
  const arcName = formatArcName(target);
  return `ARC ${arcName} :: status: operational (mock placeholder)`;
};

export const buildResponse = (route: CommandRoute) => {
  const role: MessageRole = 'sage';
  let body: string;

  switch (route.type) {
    case 'SYSTEM_STATUS':
      body = 'SAGE systems nominal. All arcs responsive.';
      break;
    case 'ARC_STATUS':
      body = 'Arc channels aligned. Awaiting directive.';
      break;
    case 'ARC_QUERY':
      body = buildArcQueryResponse(route.target);
      break;
    case 'FEDERATION_QUERY':
      body = 'Federation lattice holds. All relays reporting nominal.';
      break;
    case 'NODE_STATUS':
      body = 'Local node status: operational (mock placeholder).';
      break;
    case 'RHO2_EPOCH':
      body = 'Rho² epoch stream initialized (placeholder).';
      break;
    case 'HELP':
      body = buildHelpResponse();
      break;
    case 'UNKNOWN':
    default:
      body = "Unrecognized directive. Type 'help' for valid commands.";
      break;
  }

  const delay = baseDelay + Math.floor(Math.random() * delayVariance);

  return { role, body, delay };
};

