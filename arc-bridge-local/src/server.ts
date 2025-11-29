import express from "express";
import cors from "cors";
import * as http from "http";

import health from "./routes/health.js";
import whisperer from "./routes/whisperer.js";
import rho2 from "./routes/rho2.js";
import federation from "./routes/federation.js";
import commands from "./routes/commands.js";
import federationState from "./routes/federationState.js";
import operator from "./routes/operator.js";
import actions from "./routes/actions.js";
import intent from "./routes/intent.js";
import act from "./routes/act.js";

import { initWSS } from "./ws/stream.js";
import { FederationSignalBus } from "./federation/FederationSignalBus.js";

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

// Phase 14.7: Federation routes (no /api prefix for SAGE UI compatibility)
app.use("/", federation);

// Phase 15.3: Federation Commands API
app.use("/federation/commands", commands);

// Phase 15.8: Federation State API (read-only)
app.use("/federation/state", federationState);

// Phase 17.4: Operator Registration API (passive, non-auth)
app.use("/federation/operator", operator);

// Phase 21: Action Store + Audit Trail (passive, no execution)
app.use("/federation/action", actions);

// -----------------------------------------------------------------------------
// PHASE 7 — UNIFIED TELEMETRY STREAM
// -----------------------------------------------------------------------------
initWSS(server);

// -----------------------------------------------------------------------------
// Emit heartbeat every 3 seconds
// -----------------------------------------------------------------------------
setInterval(() => {
  FederationSignalBus.emitSignal("HEARTBEAT_TICK", "arc-bridge-local", {
    load: Math.random(),
    uptime: process.uptime(),
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
