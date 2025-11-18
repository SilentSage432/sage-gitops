let socket: WebSocket | null = null;

export function createStream(onMessage: (data: any) => void) {
  const WS_BASE = (import.meta.env.VITE_WS_BASE ?? "ws://localhost:7070").replace(/\/$/, "");
  const url = `${WS_BASE}/stream`;
  
  socket = new WebSocket(url);

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch {}
  };

  return {
    close() {
      socket?.close();
    }
  };
}

