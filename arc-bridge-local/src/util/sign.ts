import crypto from "crypto";

// Dev-mode Rho² signing stub.
const DEV_SECRET = "rho2-dev-secret-key";

export function signPayload(payload: any): string {
  return crypto
    .createHmac("sha256", DEV_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");
}

export function verifySignature(payload: any, signature: string): boolean {
  const check = signPayload(payload);
  return check === signature;
}

