export type WhispererMessageType = 'operator' | 'sage' | 'system' | 'warn' | 'error';
export type WhispererIntent = 'greeting' | 'system_query' | 'unknown';

export interface WhispererMessage {
  id: string;
  type: WhispererMessageType;
  content: string;
  timestamp: string;
  intent?: WhispererIntent;
}

export interface ParsedCommand {
  intent: WhispererIntent;
  raw: string;
}

