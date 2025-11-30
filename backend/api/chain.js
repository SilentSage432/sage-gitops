import express from "express";
import { buildExecutionChain } from "../federation/execution-chain.js";

export const router = express.Router();

router.get("/execution/chain", (req, res) => {
  const action = req.query.action || "none";
  const chain = buildExecutionChain(action);
  
  return res.json({
    ok: true,
    ...chain,
    note: "Read-only execution chain simulation. No execution.",
  });
});

