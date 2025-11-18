export type MessageRole = 'operator' | 'sage' | 'system' | 'arc';

export interface MessageEntry {
  id: string;
  role: MessageRole;
  body: string;
  timestamp: string;
}

