// Phase 15.3: Command API Endpoint
// Allows UIs and tooling to query the current command queue
import { Router } from "express";
import { getRecentCommands } from "../federation/commandQueue.js";

const router = Router();

router.get("/", (_req, res) => {
  try {
    res.json({
      commands: getRecentCommands(),
    });
  } catch (error) {
    console.error("Error in /federation/commands:", error);
    res.json({
      commands: [],
    });
  }
});

export default router;

