// Simulated dispatch bus (no real delivery).

export const virtualBus = [];

export function simulateSend(envelope) {
  virtualBus.push({
    envelope,
    ts: Date.now(),
    note: "Simulated dispatch only",
  });
}

export function getVirtualBusLog() {
  return virtualBus;
}

