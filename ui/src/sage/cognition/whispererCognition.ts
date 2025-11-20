let lastHeartbeat = Date.now();
let errorTimestamps: number[] = [];

function emitAlert(msg: string) {
  const event = new CustomEvent("SAGE_ALERT", { detail: msg });
  window.dispatchEvent(event);
  console.warn("[ALERT]", msg);
}

export function processCognitiveHooks(messages: string[]) {
  if (!messages.length) return;

  const latest = messages[messages.length - 1];
  const now = Date.now();

  if (latest.includes("[HEARTBEAT_TICK]")) {
    const diff = now - lastHeartbeat;
    if (diff > 2500) {
      emitAlert("Heartbeat drift detected");
    }
    lastHeartbeat = now;
  }

  if (latest.includes("[ERROR]")) {
    errorTimestamps.push(now);
    errorTimestamps = errorTimestamps.filter((ts) => now - ts < 5000);

    if (errorTimestamps.length >= 3) {
      emitAlert("Error storm detected");
    }
  }

  if (
    latest.includes("shard mismatch") ||
    latest.includes("seal failure") ||
    latest.includes("integrity violation") ||
    latest.includes("invalid signature")
  ) {
    emitAlert("Rho² anomaly detected");
  }

  if (
    latest.includes("FEDERATION_TIMEOUT") ||
    latest.includes("NODE_UNREACHABLE")
  ) {
    emitAlert("Federation instability detected");
  }
}

export default processCognitiveHooks;

