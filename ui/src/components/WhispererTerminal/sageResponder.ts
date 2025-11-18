import { ParsedCommand } from './whispererTypes';

const responses: Record<ParsedCommand['intent'], string[]> = {
  greeting: [
    'Connected.',
    'Standing by, Operator.',
    'Acknowledged.',
  ],
  system_query: [
    'Arc channels aligned.',
    'The mesh is stable.',
    'Bridge telemetry steady.',
  ],
  unknown: [
    'Acknowledged.',
    'Awaiting further detail.',
    'Signal received.',
  ],
};

const getRandomDelay = () => 300 + Math.floor(Math.random() * 401); // 300-700ms

export const resolveSageResponse = (command: ParsedCommand) => {
  const pool = responses[command.intent] ?? responses.unknown;
  const content = pool[Math.floor(Math.random() * pool.length)];

  return {
    delay: getRandomDelay(),
    content,
  };
};


