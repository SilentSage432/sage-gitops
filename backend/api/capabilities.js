import express from "express";
import { buildCapabilityGraph } from "../federation/capability-graph.js";

export const router = express.Router();

router.get("/capabilities", (req, res) => {
  return res.json({
    ok: true,
    graph: buildCapabilityGraph(),
  });
});

