import type { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { signPayload } from "../util/sign.js";
import type { SageEvent } from "../types/telemetry.js";

declare global {
  var SAGE_STREAM: ((obj: any) => void) | undefined;
}

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

  function broadcast(obj: any) {
    if (!wss) {
      return;
    }
    // Wrap into Fortress Telemetry Envelope
    const event: SageEvent = {
      type: obj.type || "GENERIC",
      timestamp: Date.now(),
      payload: obj.payload || obj,
      signature: signPayload(obj.payload || obj)
    };

    const data = JSON.stringify(event);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  // Expose broadcast so routes can send events
  globalThis.SAGE_STREAM = broadcast;

  console.log("WebSocket stream: ws://localhost:7070/stream");
}

export function broadcast(payload: Record<string, unknown>) {
  if (!wss) {
    return;
  }
  // Wrap into Fortress Telemetry Envelope
  const event: SageEvent = {
    type: (payload as any).type || "GENERIC",
    timestamp: Date.now(),
    payload: (payload as any).payload || payload,
    signature: signPayload((payload as any).payload || payload)
  };

  const data = JSON.stringify(event);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

