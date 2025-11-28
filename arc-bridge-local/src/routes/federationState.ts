// Phase 15.8: Federation State API
// Read-only access to federation state: events, commands, subscriptions
// Phase 16.2: Extended with intent/state divergence detection
// Passive, read-only, metadata only - NO dispatch, NO outbound messages, NO execution
import { Router, Request, Response } from "express";
import { getRecentCommands } from "../federation/commandQueue.js";
import { listSubscriptions } from "../federation/subscriptions.js";
import { listIntents } from "../federation/intent.js";
import { detectDivergence } from "../federation/divergence.js";
import { getEventsForState } from "./federation.js";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  try {
    // Phase 15.8: Return structured federation state
    // Phase 16.2: Extended with divergence detection
    res.json({
      events: getEventsForState(),
      commands: getRecentCommands(),
      subscriptions: listSubscriptions(),
      intents: listIntents(),
      divergence: detectDivergence(),
      ts: Date.now(),
    });
  } catch (error) {
    console.error("Error in /federation/state:", error);
    res.json({
      events: [],
      commands: [],
      subscriptions: [],
      intents: [],
      divergence: [],
      ts: Date.now(),
    });
  }
});

export default router;

