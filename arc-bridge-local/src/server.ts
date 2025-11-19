import express from "express";
import cors from "cors";
import * as http from "http";

import health from "./routes/health.js";
import whisperer from "./routes/whisperer.js";
import rho2 from "./routes/rho2.js";
import federation from "./routes/federation.js";

import { WebSocketServer, WebSocket } from "ws";
import { setWSS } from "./ws/stream.js";

// -----------------------------------------------------------------------------
// Initialize Express
// -----------------------------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json());

// HTTP server instance so WebSocket can attach
const server = http.createServer(app);

// -----------------------------------------------------------------------------
// API routes
// -----------------------------------------------------------------------------
app.use("/api", health);
app.use("/api", whisperer);
app.use("/api", rho2);
app.use("/api", federation);

// -----------------------------------------------------------------------------
// PHASE 7 — UNIFIED TELEMETRY STREAM
// -----------------------------------------------------------------------------
const wss = new WebSocketServer({ server, path: "/stream" });
setWSS(wss); // Initialize for broadcastEvent in routes

function broadcast(msg: any) {
  const raw = JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(raw);
    }
  }
}

// Log connections
wss.on("connection", (ws: WebSocket) => {
  console.log("🔵 Telemetry client connected");

  ws.send(
    JSON.stringify({
      type: "system",
      level: "info",
      source: "arc-bridge",
      message: "Arc Bridge Local Telemetry Online",
      ts: Date.now(),
    })
  );
});

// -----------------------------------------------------------------------------
// Emit example test packets every 3s (UI verification)
// -----------------------------------------------------------------------------
setInterval(() => {
  broadcast({
    type: "telemetry",
    source: "arc",
    level: "info",
    message: "Arc heartbeat",
    ts: Date.now(),
  });

  broadcast({
    type: "telemetry",
    source: "rho2",
    level: "debug",
    message: "Rho² encryption module sync pulse",
    ts: Date.now(),
  });

  broadcast({
    type: "telemetry",
    source: "whisperer",
    level: "trace",
    message: "Whisperer idle",
    ts: Date.now(),
  });
}, 3000);

// -----------------------------------------------------------------------------
// Start server
// -----------------------------------------------------------------------------
const PORT = 7070;
server.listen(PORT, () => {
  console.log(`Arc Bridge Local running on http://localhost:${PORT}`);
  console.log(`WebSocket stream: ws://localhost:${PORT}/stream`);
});
