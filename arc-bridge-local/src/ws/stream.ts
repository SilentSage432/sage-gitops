import { WebSocketServer } from "ws";

let wss: WebSocketServer;

export function initWSS(server: any) {
  wss = new WebSocketServer({ server, path: "/stream" });
  console.log("WebSocket /stream online");
}

export function broadcastEvent(event: any) {
  if (!wss) return;
  wss.clients.forEach(client => {
    try {
      client.send(JSON.stringify(event));
    } catch {}
  });
}

