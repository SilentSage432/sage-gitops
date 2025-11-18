import { ParsedCommand } from './whispererTypes';

const greetingPatterns = /(hello|hi|hail|greetings|salutations|operator)/i;
const systemPatterns = /(status|state|report|bridge|mesh|system|channels|alignment)/i;

export const parseCommand = (input: string): ParsedCommand => {
  const raw = input.trim();
  const normalized = raw.toLowerCase();

  if (greetingPatterns.test(normalized)) {
    return { intent: 'greeting', raw };
  }

  if (systemPatterns.test(normalized)) {
    return { intent: 'system_query', raw };
  }

  return { intent: 'unknown', raw };
};


