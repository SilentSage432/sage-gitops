import { MessageRole } from './messageTypes';
import { CommandRoute } from './commandRouter';
import { getArcStatus, getArcSummary } from '../../services/arcService';
import { getFederationNodes } from '../../services/federationService';
import { getNodeHealth } from '../../services/nodeService';
import { getEpochStream } from '../../services/rho2Service';

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

const formatArcQueryResponse = (arcStatus: Awaited<ReturnType<typeof getArcStatus>>): string => {
  const arcName = formatArcName(arcStatus.name);
  const statusLabel = arcStatus.status.toUpperCase();
  const signals = arcStatus.signals > 0 ? ` | signals: ${arcStatus.signals}` : '';
  const warnings = arcStatus.warnings > 0 ? ` | warnings: ${arcStatus.warnings}` : '';
  return `ARC ${arcName} :: status: ${statusLabel}${signals}${warnings}`;
};

const formatFederationNodesResponse = (nodes: Awaited<ReturnType<typeof getFederationNodes>>): string => {
  if (nodes.length === 0) {
    return 'No federation nodes detected.';
  }
  const lines = nodes.map((node) => 
    `  ${node.id} [${node.role}] ${node.status} (${node.pods} pods)`
  );
  return `Federation nodes:\n${lines.join('\n')}`;
};

const formatNodeHealthResponse = (health: Awaited<ReturnType<typeof getNodeHealth>>): string => {
  return `Node health: ${health.status.toUpperCase()}\n  CPU: ${health.cpu}% | Memory: ${health.mem}% | Pods: ${health.pods}`;
};

const formatEpochStreamResponse = (stream: Awaited<ReturnType<typeof getEpochStream>>): string => {
  return `Rho² epoch: ${stream.currentEpoch}\n  Fingerprint: ${stream.fingerprint}\n  Participants: ${stream.participants} | Integrity: ${stream.integrity}\n  Next epoch ETA: ${stream.nextEpochEtaSeconds}s`;
};

export const buildResponse = async (route: CommandRoute) => {
  const role: MessageRole = 'sage';
  let body: string;

  switch (route.type) {
    case 'SYSTEM_STATUS': {
      const summary = await getArcSummary();
      const operational = summary.filter((a) => a.status === 'operational').length;
      body = `SAGE systems nominal. ${operational}/${summary.length} arcs operational.`;
      break;
    }
    case 'ARC_STATUS': {
      const summary = await getArcSummary();
      const lines = summary.map((arc) => `  ${arc.name}: ${arc.status}`);
      body = `Arc channels:\n${lines.join('\n')}`;
      break;
    }
    case 'ARC_QUERY': {
      const arcStatus = await getArcStatus(route.target || '');
      body = formatArcQueryResponse(arcStatus);
      break;
    }
    case 'FEDERATION_QUERY': {
      const nodes = await getFederationNodes();
      body = formatFederationNodesResponse(nodes);
      break;
    }
    case 'NODE_STATUS': {
      const health = await getNodeHealth();
      body = formatNodeHealthResponse(health);
      break;
    }
    case 'RHO2_EPOCH': {
      const stream = await getEpochStream();
      body = formatEpochStreamResponse(stream);
      break;
    }
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

