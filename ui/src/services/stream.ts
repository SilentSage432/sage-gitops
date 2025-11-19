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

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data?.type && data?.payload) {
        onMessage(`[${data.type}] ${JSON.stringify(data.payload)}`);
      } else {
        onMessage(event.data);
      }
    } catch {
      onMessage(event.data);
    }
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

