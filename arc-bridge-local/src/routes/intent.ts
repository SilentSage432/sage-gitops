import { Router } from "express";

import { analyzeIntent } from "../services/intentEngine.js";

const router = Router();

router.post("/intent", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text" });

  const intent = analyzeIntent(text);
  return res.json(intent);
});

export default router;

