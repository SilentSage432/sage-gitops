import { Router } from "express";
import type { WhispererMessage } from "../types/shared.js";
import { FederationSignalBus } from "../federation/FederationSignalBus.js";

const router = Router();

router.post("/whisperer/message", (req, res) => {
  const msg: WhispererMessage = {
    id: crypto.randomUUID(),
    role: "operator",
    text: req.body.text,
    timestamp: Date.now()
  };

  FederationSignalBus.emitSignal("WHISPERER_MESSAGE", "operator", msg);

  res.json({ ok: true, message: msg });
});

router.post("/whisperer/send", (req, res) => {
  const { message } = req.body;
  
  FederationSignalBus.emitSignal("WHISPERER_MESSAGE", "operator", {
    text: message,
    timestamp: Date.now()
  });

  res.json({ ok: true });
});

export default router;

