import { Router } from "express";

import { routeAction } from "../services/actionRouter.js";

const router = Router();

router.post("/act", async (req, res) => {
  const { intent } = req.body;
  if (!intent) return res.status(400).json({ error: "Missing intent object" });

  const result = await routeAction(intent);
  return res.json(result);
});

export default router;

