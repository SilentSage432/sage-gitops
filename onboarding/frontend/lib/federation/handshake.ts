import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

let federationToken: string | null = null;

export interface FederationHandshakeResponse {
  ok: boolean;
  tenantId: string;
  nodeId: string;
  federationToken: string;
  federated: boolean;
  cipher: string;
  expiresIn: number;
}

export async function performFederationHandshake(
  nodeId: string,
  tenantId: string,
  fingerprint: string
): Promise<FederationHandshakeResponse> {
  // STEP 1: request challenge
  const challengeResp = await axios.post(
    `${API_BASE_URL}/api/federation/auth/handshake`,
    {
      nodeId,
      tenantId,
      fingerprint,
    }
  );

  const { challenge } = challengeResp.data;

  // STEP 2: sign using bootstrap fingerprint
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(fingerprint),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureRaw = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(challenge)
  );

  const signature = Buffer.from(new Uint8Array(signatureRaw)).toString("hex");

  // STEP 3: assert
  const assertResp = await axios.post(
    `${API_BASE_URL}/api/federation/auth/assert`,
    {
      nodeId,
      tenantId,
      fingerprint,
      signature,
    }
  );

  federationToken = assertResp.data.federationToken;
  return assertResp.data;
}

export function getFederationToken(): string | null {
  return federationToken;
}

export function setFederationToken(token: string | null): void {
  federationToken = token;
}

