import type { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { FederationSignalBus } from "../federation/FederationSignalBus.js";

let wss: WebSocketServer | null = null;

export function initWSS(server: HttpServer) {
  wss = new WebSocketServer({ server, path: "/stream" });

  wss.on("connection", (ws: WebSocket) => {
    console.log("🔵 Telemetry client connected");
    ws.send(JSON.stringify({ type: "CONNECTED", at: Date.now() }));

    ws.on("close", () => {
      console.log("🔴 Telemetry client disconnected");
    });
  });

  // Broadcast every FSO event to all sockets
  FederationSignalBus.on("federation-signal", (evt) => {
    const msg = JSON.stringify({ type: "FEDERATION_EVENT", evt });
    if (wss) {
      wss.clients.forEach((client) => {
        if (client.readyState === 1) client.send(msg);
      });
    }
  });

  console.log("WebSocket stream: ws://localhost:7070/stream");
}

export function broadcast(text: string) {
  if (!wss) return;
  wss.clients.forEach((c) => c.readyState === 1 && c.send(text));
}

