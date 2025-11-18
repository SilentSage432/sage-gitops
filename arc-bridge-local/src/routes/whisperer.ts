import { Router } from "express";
import type { WhispererMessage } from "../types/shared.js";
import { broadcastEvent } from "../ws/stream.js";

const router = Router();

router.post("/whisperer/message", (req, res) => {
  const msg: WhispererMessage = {
    id: crypto.randomUUID(),
    role: "operator",
    text: req.body.text,
    timestamp: Date.now()
  };

  broadcastEvent({ type: "whisperer-message", payload: msg });

  res.json({ ok: true, message: msg });
});

export default router;

