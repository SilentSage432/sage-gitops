// Phase 17.7: Passive WebAuthn Challenge Generator
// Does NOT perform verification or enforcement yet
// Just challenge generation and temporary storage
import { randomBytes } from "crypto";

let currentChallenge: string | null = null;
let challengeTimestamp: number = 0;

// Challenge expiry: 5 minutes (300000ms)
const CHALLENGE_EXPIRY = 5 * 60 * 1000;

// generateChallenge creates a new WebAuthn challenge
// Returns a base64url-encoded random string suitable for WebAuthn
export function generateChallenge(): string {
  // Generate 32 random bytes and encode as base64url
  const random = randomBytes(32);
  // Convert to base64url (WebAuthn standard format)
  const challenge = random
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  currentChallenge = challenge;
  challengeTimestamp = Date.now();

  return challenge;
}

// getCurrentChallenge returns the current challenge if it exists and hasn't expired
// Returns null if no challenge or if expired
export function getCurrentChallenge(): string | null {
  if (!currentChallenge) {
    return null;
  }

  // Check if challenge has expired
  const age = Date.now() - challengeTimestamp;
  if (age > CHALLENGE_EXPIRY) {
    currentChallenge = null;
    challengeTimestamp = 0;
    return null;
  }

  return currentChallenge;
}

// clearChallenge clears the current challenge
export function clearChallenge(): void {
  currentChallenge = null;
  challengeTimestamp = 0;
}

