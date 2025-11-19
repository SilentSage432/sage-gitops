import { Router } from "express";
import type { WhispererMessage } from "../types/shared.js";
import { broadcast } from "../ws/stream.js";

const router = Router();

router.post("/whisperer/message", (req, res) => {
  const msg: WhispererMessage = {
    id: crypto.randomUUID(),
    role: "operator",
    text: req.body.text,
    timestamp: Date.now()
  };

  broadcast({
    type: "WHISPERER_NOTICE",
    payload: msg
  });

  res.json({ ok: true, message: msg });
});

export default router;

