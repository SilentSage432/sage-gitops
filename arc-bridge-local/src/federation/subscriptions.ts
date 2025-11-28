// Passive subscription registry for command channels
// No delivery, no execution, no remote actions

export interface Subscription {
  id: string;
  channel: string;
  ts: number;
}

const subscriptions: Subscription[] = [];

export function registerSubscription(id: string, channel: string): void {
  subscriptions.push({
    id,
    channel,
    ts: Date.now(),
  });
}

export function listSubscriptions(): Subscription[] {
  return subscriptions;
}

