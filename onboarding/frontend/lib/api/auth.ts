import axios from 'axios';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface WebAuthnChallengeResponse {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: string;
    alg: number;
  }>;
  timeout: number;
  attestation: string;
}

export interface WebAuthnVerifyRequest {
  credential: any;
  challenge: string;
}

export interface OCTResponse {
  token: string;
  expiresAt: number;
  scopes: string[];
}

export async function requestWebAuthnChallenge(): Promise<WebAuthnChallengeResponse> {
  const response = await axios.post(`${API_BASE_URL}/v1/init/webauthn/challenge`);
  return response.data;
}

export async function verifyWebAuthnCredential(credential: any, challenge: string): Promise<{ success: boolean; deviceName?: string }> {
  const response = await axios.post(`${API_BASE_URL}/v1/init/webauthn/verify`, {
    credential,
    challenge,
  });
  return response.data;
}

export async function issueOCT(): Promise<OCTResponse> {
  const response = await axios.post(`${API_BASE_URL}/rho2/auth/issue`);
  return response.data;
}

export async function verifyOCT(token: string): Promise<{ valid: boolean; scopes?: string[]; expiresAt?: number }> {
  try {
    const response = await axios.post(`${API_BASE_URL}/rho2/auth/verify`, { token });
    return response.data;
  } catch (error) {
    return { valid: false };
  }
}

export async function performWebAuthnRegistration(): Promise<{ success: boolean; deviceName?: string }> {
  try {
    const challengeResponse = await requestWebAuthnChallenge();
    
    const credential = await startRegistration({
      optionsJSON: {
        rp: {
          name: challengeResponse.rp.name,
          id: challengeResponse.rp.id,
        },
        user: {
          id: challengeResponse.user.id,
          name: challengeResponse.user.name,
          displayName: challengeResponse.user.displayName,
        },
        challenge: challengeResponse.challenge,
        pubKeyCredParams: challengeResponse.pubKeyCredParams.map(param => ({
          type: 'public-key' as const,
          alg: param.alg,
        })),
        timeout: challengeResponse.timeout,
        attestation: challengeResponse.attestation as any,
        excludeCredentials: [],
        authenticatorSelection: {
          authenticatorAttachment: 'cross-platform',
          userVerification: 'required',
          requireResidentKey: false,
        },
      },
    });

    const verifyResponse = await verifyWebAuthnCredential(credential, challengeResponse.challenge);
    return verifyResponse;
  } catch (error: any) {
    console.error('WebAuthn registration error:', error);
    return { success: false };
  }
}

export async function performWebAuthnAuthentication(): Promise<{ success: boolean; deviceName?: string }> {
  try {
    const challengeResponse = await requestWebAuthnChallenge();
    
    const credential = await startAuthentication({
      optionsJSON: {
        challenge: challengeResponse.challenge,
        timeout: challengeResponse.timeout,
        rpId: challengeResponse.rp.id,
      },
    });

    const verifyResponse = await verifyWebAuthnCredential(credential, challengeResponse.challenge);
    return verifyResponse;
  } catch (error: any) {
    console.error('WebAuthn authentication error:', error);
    return { success: false };
  }
}

