// Phase 75: WebAuthn Challenge Flow (Still Passive)
// Generates WebAuthn challenges for hardware key verification
// Still no enforcement - just challenge generation and verification plumbing

import crypto from "crypto";

export function generateWebAuthnChallenge() {
  // Generate a random 32-byte challenge and return as base64
  return crypto.randomBytes(32).toString("base64");
}

