export type StreamHandler = (msg: unknown) => void;

const WS_ENDPOINT =
  (import.meta.env.VITE_WS_BASE ?? "ws://localhost:7070").replace(/\/$/, "") +
  "/stream";

class ArcBridge {
  private ws: WebSocket | null = null;
  private handlers: Set<StreamHandler> = new Set();
  private reconnectDelay = 1500;
  private heartbeatInterval: number | null = null;
  private manuallyClosed = false;

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.manuallyClosed = false;
    this.ws = new WebSocket(WS_ENDPOINT);

    this.ws.onopen = () => {
      console.log("🟢 ArcBridge: connected");
      this.startHeartbeat();
    };

    this.ws.onclose = () => {
      console.log("🔴 ArcBridge: disconnected");
      this.stopHeartbeat();
      if (!this.manuallyClosed) {
        setTimeout(() => this.connect(), this.reconnectDelay);
      }
    };

    this.ws.onerror = (err) => {
      console.warn("⚠️ ArcBridge websocket error", err);
    };

    this.ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        this.handlers.forEach((handler) => handler(data));
      } catch (error) {
        console.warn("ArcBridge parse error:", error);
      }
    };
  }

  disconnect() {
    this.manuallyClosed = true;
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
  }

  send(payload: unknown) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("WS not ready, dropping message:", payload);
      return;
    }
    this.ws.send(JSON.stringify(payload));
  }

  onMessage(handler: StreamHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ kind: "heartbeat" }));
      }
    }, 5000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

export const arcBridge = new ArcBridge();

