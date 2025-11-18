import { MessageRole } from './messageTypes';

export type ResponseIntent =
  | 'status'
  | 'arc'
  | 'federation'
  | 'epoch'
  | 'rho2'
  | 'health'
  | 'unknown';

const responseMap: Record<ResponseIntent, string> = {
  status: 'Systems steady. No variance detected.',
  arc: 'Arc channels aligned. Awaiting directive.',
  federation: 'Federation lattice holds. All relays reporting nominal.',
  epoch: 'Epoch clocks synchronized. Temporal drift negligible.',
  rho2: 'Rho2 lodges sealed. Clearance remains restricted.',
  health: 'Vital bands are stable. No faults to report.',
  unknown: 'Directive parsed. Standing by.',
};

const intentMatchers: Array<{ intent: ResponseIntent; pattern: RegExp }> = [
  { intent: 'status', pattern: /(status|state|report|overview|diagnostic)/i },
  { intent: 'arc', pattern: /(arc|theta|sigma|omega|lambda|chi)/i },
  { intent: 'federation', pattern: /(federation|mesh|council|summit)/i },
  { intent: 'epoch', pattern: /(epoch|cycle|phase|chrono)/i },
  { intent: 'rho2', pattern: /(rho2|rho-2|rho 2)/i },
  { intent: 'health', pattern: /(health|vitals|pulse|integrity)/i },
];

export const classifyIntent = (input: string): ResponseIntent => {
  for (const matcher of intentMatchers) {
    if (matcher.pattern.test(input)) {
      return matcher.intent;
    }
  }
  return 'unknown';
};

const baseDelay = 350;
const delayVariance = 200;

export const buildResponse = (input: string, intent: ResponseIntent) => {
  const role: MessageRole = 'sage';
  const resolvedIntent = intent === 'unknown' ? classifyIntent(input) : intent;
  const body = responseMap[resolvedIntent];
  const delay = baseDelay + Math.floor(Math.random() * delayVariance);

  return { role, body, delay };
};

