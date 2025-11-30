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
import { setHardwareKey, getHardwareKey, setPendingChallenge, getPendingChallenge, clearPendingChallenge } from "../federation/operator-model.js";
import { verifyHardwareIdentity } from "../federation/hardware-verify.js";
import { currentOperator } from "../identity/operator-session.js";
import { generateWebAuthnChallenge } from "../federation/hardware-challenge.js";

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

router.post("/operator/verify-hardware", (req, res) => {
  const { signature, challenge } = req.body;
  
  // Get current operator from session
  const operatorSession = currentOperator();
  
  if (!operatorSession) {
    return res.status(401).json({
      ok: false,
      verified: false,
      reason: "no operator session",
    });
  }
  
  // Get hardware key from operator model and merge with operator session
  const hardwareKey = getHardwareKey();
  const operator = {
    ...operatorSession,
    hardwareKey: hardwareKey.id ? hardwareKey : null,
  };
  
  // Verify hardware identity (passive - no enforcement)
  const result = verifyHardwareIdentity(signature, challenge, operator);
  
  return res.json({
    ok: true,
    ...result,
    note: "Hardware verification only. We do not authenticate the operator. We do not enforce routing. We do not enforce approval. We only validate.",
  });
});

router.get("/operator/hardware/challenge", (req, res) => {
  // Phase 75: Generate WebAuthn challenge
  const challenge = generateWebAuthnChallenge();
  
  // Store challenge temporarily (we do NOT bind it to auth yet)
  setPendingChallenge(challenge);
  
  return res.json({
    ok: true,
    challenge,
    note: "Challenge generated. Not yet bound to authentication.",
  });
});

router.post("/operator/hardware/validate", (req, res) => {
  // Phase 75: Validate WebAuthn challenge response
  const { challenge, signature } = req.body;
  
  // Get current operator from session
  const operatorSession = currentOperator();
  
  if (!operatorSession) {
    return res.status(401).json({
      ok: false,
      verified: false,
      reason: "no operator session",
    });
  }
  
  // Get hardware key
  const hardwareKey = getHardwareKey();
  
  // Validate challenge matches pending challenge
  const pendingChallenge = getPendingChallenge();
  const valid =
    pendingChallenge &&
    challenge &&
    challenge === pendingChallenge &&
    signature &&
    hardwareKey?.id;
  
  // Clear pending challenge after use
  if (valid) {
    clearPendingChallenge();
  }
  
  // We still don't enforce cryptographic signature inspection yet - that comes shortly
  // This is still safe
  
  return res.json({
    ok: true,
    verified: !!valid,
    keyId: hardwareKey?.id || null,
    reason: valid ? null : "challenge mismatch or missing signature",
    note: "WebAuthn validation only. Still no cryptographic signature inspection. Still no enforcement.",
  });
});

