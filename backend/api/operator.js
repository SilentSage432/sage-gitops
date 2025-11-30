// Phase 73: Registerable Hardware Identity
// Endpoint for hardware key registration (still passive)
// We DO NOT yet:
// - authenticate
// - validate
// - require the key
// - bind routing or execution to it
// - enforce policy
// It just enables: "This operator now has a hardware identity."

import express from "express";
import { setHardwareKey, getHardwareKey } from "../federation/operator-model.js";

export const router = express.Router();

router.post("/operator/register-hardware", (req, res) => {
  const { id, publicKey } = req.body;
  
  if (!id || !publicKey) {
    return res.status(400).json({
      ok: false,
      error: "id and publicKey are required",
      note: "Hardware registration requires both key id and public key.",
    });
  }
  
  const hardwareKey = setHardwareKey({
    id,
    publicKey,
    registeredAt: Date.now(),
  });
  
  return res.json({
    status: "registered",
    keyId: id,
    time: hardwareKey.registeredAt,
    note: "Hardware identity registered. Not yet activated for authentication or enforcement.",
  });
});

router.get("/operator/hardware", (req, res) => {
  const hardwareKey = getHardwareKey();
  
  return res.json({
    ok: true,
    hardwareKey,
    registered: !!hardwareKey.id,
  });
});

