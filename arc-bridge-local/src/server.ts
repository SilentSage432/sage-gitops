import express from "express";
import cors from "cors";
import http from "http";

import health from "./routes/health.js";
import whisperer from "./routes/whisperer.js";
import rho2 from "./routes/rho2.js";
import federation from "./routes/federation.js";
import { initWSS } from "./ws/stream.js";

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use("/api", health);
app.use("/api", whisperer);
app.use("/api", rho2);
app.use("/api", federation);

// HTTP server instance so WS can attach
const server = http.createServer(app);

// Initialize WebSocket stream
initWSS(server);

const PORT = 7070;
server.listen(PORT, () => {
  console.log(`Arc Bridge Local running on http://localhost:${PORT}`);
});

