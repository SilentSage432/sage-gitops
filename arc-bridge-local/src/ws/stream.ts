import { WebSocketServer } from "ws";

let wss: WebSocketServer | null = null;

export function setWSS(server: WebSocketServer) {
  wss = server;
}

export function broadcastEvent(event: any) {
  if (!wss) return;
  const raw = JSON.stringify(event);
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(raw);
    }
  }
}
