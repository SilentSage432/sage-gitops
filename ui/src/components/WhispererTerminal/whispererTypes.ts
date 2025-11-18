export type WhispererMessageType = 'operator' | 'sage' | 'system' | 'warn' | 'error';

export interface WhispererMessage {
  id: string;
  type: WhispererMessageType;
  content: string;
  timestamp: string;
}

