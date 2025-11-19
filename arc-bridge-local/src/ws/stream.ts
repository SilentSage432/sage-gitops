import type { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

let wss: WebSocketServer | null = null;

export function initWSS(server: HttpServer) {
  wss = new WebSocketServer({ server, path: "/stream" });

  wss.on("connection", (ws: WebSocket) => {
    console.log("🔵 Telemetry client connected");

    ws.on("message", (data) => {
      let msg: { kind?: string; content?: string } | undefined;
      try {
        msg = JSON.parse(String(data));
      } catch {
        return;
      }

      if (msg?.kind === "operator_command") {
        ws.send(
          JSON.stringify({
            kind: "ack",
            content: `Command received: ${msg.content}`,
            ts: Date.now(),
          }),
        );
      }
    });

    ws.on("close", () => {
      console.log("🔴 Telemetry client disconnected");
    });
  });

  console.log("WebSocket stream: ws://localhost:7070/stream");
}

export function broadcast(payload: Record<string, unknown>) {
  if (!wss) {
    return;
  }
  const envelope = {
    kind: payload.kind ?? "telemetry",
    ts: payload.ts ?? Date.now(),
    ...payload,
  };
  const raw = JSON.stringify(envelope);

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(raw);
    }
  }
}

