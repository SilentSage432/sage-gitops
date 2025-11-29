// Phase 17.4: Operator Registration Flow (Passive, Non-auth)
// Phase 17.6: Extended with credential storage
// Phase 17.7: Extended with WebAuthn challenge generation
// Phase 18: Extended with passive verification
// Passive operator registration endpoint
// This does NOT authenticate or enforce security yet
// Just the model - no permissions, no enforcement, no control paths
import { Router, Request, Response } from "express";
import { registerOperator } from "../federation/operator.js";
import { generateChallenge, getCurrentChallenge } from "../federation/webauthn-challenge.js";
import { verifyAssertion } from "../federation/webauthn-verify.js";
import { markOperatorVerified } from "../federation/operator-session.js";

const router = Router();

// POST /federation/operator/register
// Registers an operator identity (passive, non-authenticated)
router.post("/register", (req: Request, res: Response) => {
  try {
    const op = req.body;

    if (!op?.id) {
      return res.status(400).json({ error: "Missing operator id" });
    }

    // Phase 17.4: Register operator with provided ID
    // Phase 17.6: Include credential if provided
    // Source defaults to "pending" until proper authentication is added
    registerOperator({
      id: op.id,
      source: op.source || "pending",
      credential: op.credential || null,
      metadata: op.metadata,
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error("Error in operator registration:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Phase 17.6: Store operator credential (passive, non-verified)
// Stores WebAuthn/YubiKey credentials, but does NOT validate or verify them
router.post("/credential", (req: Request, res: Response) => {
  try {
    const { id, credential } = req.body;

    if (!id || !credential) {
      return res.status(400).json({ error: "Missing id or credential" });
    }

    // Phase 17.6: Register operator with credential
    // No verification, no validation, no authentication - just storage
    registerOperator({
      id,
      source: credential.attestation ? "webauthn" : "pending",
      credential: credential,
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error("Error in credential storage:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Phase 17.7: WebAuthn Challenge Endpoints (passive, non-verified)
// GET /federation/operator/challenge - Generate new challenge
router.get("/challenge", (req: Request, res: Response) => {
  try {
    const challenge = generateChallenge();
    res.json({ challenge });
  } catch (error) {
    console.error("Error generating challenge:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /federation/operator/challenge/current - Read current challenge
router.get("/challenge/current", (req: Request, res: Response) => {
  try {
    const challenge = getCurrentChallenge();
    res.json({ challenge });
  } catch (error) {
    console.error("Error reading challenge:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Phase 17.8: Store WebAuthn assertion (passive, non-verified)
// Receives WebAuthn signed assertion and stores it
// Does NOT verify or authenticate yet - just storage
router.post("/assertion", (req: Request, res: Response) => {
  try {
    const { id, assertion } = req.body;

    if (!id || !assertion) {
      return res.status(400).json({ error: "Missing id or assertion" });
    }

    // Phase 17.8: Store operator with assertion and remember active challenge
    // No verification, no validation, no authentication - just storage
    registerOperator({
      id,
      source: "webauthn",
      assertion: assertion,
      challenge: getCurrentChallenge(),
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error("Error in assertion storage:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Phase 18: Passive Verification Endpoint
// Phase 19: Extended with session acknowledgement
// Verifies WebAuthn assertions but does NOT grant authentication or access
// Only reports verification truth and records session state - no privileges, no login
router.post("/verify", (req: Request, res: Response) => {
  try {
    const { assertion } = req.body;

    if (!assertion) {
      return res.status(400).json({ ok: false, reason: "missing-assertion" });
    }

    // Phase 18: Perform verification but don't grant any access
    const result = verifyAssertion(assertion);

    // Phase 19: If verification succeeded, mark session as verified
    // Still no authority granted - just records that verification happened
    if (result.ok && result.verified) {
      markOperatorVerified();
    }

    return res.json(result);
  } catch (error) {
    console.error("Error in assertion verification:", error);
    return res.status(500).json({ ok: false, reason: "internal-error" });
  }
});

export default router;

