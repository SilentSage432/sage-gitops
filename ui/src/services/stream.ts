let ws: WebSocket | null = null;

export function initStream(onMessage: (msg: string) => void) {
  if (ws) {
    try {
      ws.close();
    } catch {
      // ignore
    }
  }

  ws = new WebSocket("ws://localhost:7070/stream");

  ws.onopen = () => {
    console.log("🔵 Whisperer Stream Connected");
  };

  ws.onmessage = async (event) => {
    const msg = JSON.parse(event.data);

    // Verify dev-mode Rho² signature
    const expected = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(JSON.stringify(msg.payload) + "rho2-dev-secret-key")
    );
    const expectedHex = Array.from(new Uint8Array(expected))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const trusted = msg.signature === expectedHex;

    const prefix = trusted ? "🟢" : "🔴 UNSIGNED";

    onMessage(
      `${prefix} [${msg.type}] @${new Date(msg.timestamp).toLocaleTimeString()} → ${
        trusted ? "verified" : "unverified"
      }\n${JSON.stringify(msg.payload, null, 2)}`
    );
  };

  ws.onclose = () => {
    console.warn("🟡 Whisperer stream closed. Reconnecting in 2s...");
    setTimeout(() => initStream(onMessage), 2000);
  };

  ws.onerror = () => {
    console.warn("🔴 Whisperer stream error.");
  };
}

export function sendStream(data: unknown) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

