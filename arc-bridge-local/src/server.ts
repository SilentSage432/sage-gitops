import express from "express";
import cors from "cors";
import * as http from "http";

import health from "./routes/health.js";
import whisperer from "./routes/whisperer.js";
import rho2 from "./routes/rho2.js";
import federation from "./routes/federation.js";
import intent from "./routes/intent.js";
import act from "./routes/act.js";

import { initWSS, broadcast } from "./ws/stream.js";

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
app.use("/api", intent);
app.use("/api", act);

// -----------------------------------------------------------------------------
// PHASE 7 — UNIFIED TELEMETRY STREAM
// -----------------------------------------------------------------------------
initWSS(server);

// -----------------------------------------------------------------------------
// Emit example test packets every 3s (UI verification)
// -----------------------------------------------------------------------------
setInterval(() => {
  broadcast({
    source: "arc",
    level: "info",
    message: "Arc heartbeat",
  });

  broadcast({
    source: "rho2",
    level: "debug",
    message: "Rho² encryption module sync pulse",
  });

  broadcast({
    source: "whisperer",
    level: "trace",
    message: "Whisperer idle",
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
