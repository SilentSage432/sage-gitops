import axios from 'axios';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { getFederationToken } from '../federation/handshake';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Phase 13.3: Add federation token to all requests
axios.interceptors.request.use((config) => {
  const token = getFederationToken();
  if (token) {
    config.headers['X-Federation-Token'] = token;
  }
  return config;
});

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
  // Use the working Go backend endpoint via Next.js rewrite
  const response = await axios.post('/api/auth/register/begin', {
    operator: 'prime'
  });
  
  // The Go backend returns the options directly (protocol.CredentialCreation)
  // It may or may not be wrapped in a publicKey property
  const options = response.data.publicKey || response.data;
  
  // The challenge and user.id come as base64 strings from Go backend
  // We need to keep them as base64 for the @simplewebauthn library
  // which will handle the conversion internally
  return {
    challenge: options.challenge, // Already base64 string
    rp: {
      name: options.rp.name,
      id: options.rp.id,
    },
    user: {
      id: options.user.id, // Already base64 string from Go backend
      name: options.user.name,
      displayName: options.user.displayName,
    },
    pubKeyCredParams: options.pubKeyCredParams || [],
    timeout: options.timeout || 300000,
    attestation: options.attestation || 'direct',
  };
}

export async function verifyWebAuthnCredential(credential: any, challenge: string): Promise<{ success: boolean; deviceName?: string }> {
  // Use the working Go backend endpoint via Next.js rewrite
  // The credential needs to be formatted for go-webauthn library
  const credentialResponse = credential.response as AuthenticatorAttestationResponse;
  
  // Helper to convert ArrayBuffer to base64url
  const arrayBufferToBase64Url = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const credentialJson = {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: arrayBufferToBase64Url(credentialResponse.clientDataJSON),
      attestationObject: arrayBufferToBase64Url(credentialResponse.attestationObject),
    },
  };

  const response = await axios.post('/api/auth/register/finish', {
    operator: 'prime',
    credential: credentialJson,
  });
  
  // Go backend returns { status: "registered" }
  return {
    success: response.data.status === 'registered',
    deviceName: 'YubiKey',
  };
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

