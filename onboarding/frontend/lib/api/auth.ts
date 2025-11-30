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
  // The structure is: { rp: {...}, user: {...}, challenge: "...", ... }
  const options = response.data;
  
  // The challenge and user.id come as base64 strings from Go backend
  // @simplewebauthn/browser expects base64url format (with - and _ instead of + and /)
  const base64ToBase64Url = (b64: string) => b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  
  // user.id from Go backend is base64 encoded bytes (as string)
  // If it's an array, convert to base64 string first
  let userIdBase64: string;
  if (typeof options.user.id === 'string') {
    userIdBase64 = options.user.id;
  } else if (Array.isArray(options.user.id)) {
    // Convert array of numbers to base64 string
    const bytes = new Uint8Array(options.user.id);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    userIdBase64 = btoa(binary);
  } else {
    // Fallback: try to stringify
    userIdBase64 = String(options.user.id);
  }
  
  return {
    challenge: base64ToBase64Url(options.challenge), // Convert to base64url
    rp: {
      name: options.rp.name,
      id: options.rp.id,
    },
    user: {
      id: base64ToBase64Url(userIdBase64), // Convert to base64url
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
    // Step 1: Get challenge from backend
    const challengeResponse = await requestWebAuthnChallenge();
    
    // Step 2: Convert base64url strings to Uint8Array for navigator.credentials.create()
    const base64UrlToUint8Array = (base64url: string): Uint8Array => {
      // Convert base64url to standard base64
      const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
      // Add padding if needed
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      // Decode to binary
      const binary = atob(padded);
      // Convert to Uint8Array
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    };

    // Convert challenge and user.id from base64url to Uint8Array
    const challengeBytes = base64UrlToUint8Array(challengeResponse.challenge);
    const userIdBytes = base64UrlToUint8Array(challengeResponse.user.id);

    // Create new ArrayBuffers from the Uint8Arrays (WebAuthn API requirement)
    const challengeBuffer = challengeBytes.buffer.slice(challengeBytes.byteOffset, challengeBytes.byteOffset + challengeBytes.byteLength);
    const userIdBuffer = userIdBytes.buffer.slice(userIdBytes.byteOffset, userIdBytes.byteOffset + userIdBytes.byteLength);

    // Step 3: Call native WebAuthn API - navigator.credentials.create()
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: challengeBuffer as ArrayBuffer,
        rp: {
          name: challengeResponse.rp.name,
          id: challengeResponse.rp.id,
        },
        user: {
          id: userIdBuffer as ArrayBuffer,
          name: challengeResponse.user.name,
          displayName: challengeResponse.user.displayName,
        },
        pubKeyCredParams: challengeResponse.pubKeyCredParams.map(param => ({
          type: 'public-key',
          alg: param.alg,
        })),
        timeout: challengeResponse.timeout,
        attestation: challengeResponse.attestation as AttestationConveyancePreference,
        excludeCredentials: [],
        authenticatorSelection: {
          authenticatorAttachment: 'cross-platform',
          userVerification: 'required',
          requireResidentKey: false,
        },
      },
    }) as PublicKeyCredential | null;

    if (!credential) {
      throw new Error('No credential returned from authenticator');
    }

    // Step 4: Convert credential to JSON format for backend
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

    // Step 5: POST to /api/auth/register/finish
    const finishResponse = await axios.post('/api/auth/register/finish', {
      operator: 'prime',
      credential: credentialJson,
    });

    // Backend returns { status: "registered" }
    return {
      success: finishResponse.data.status === 'registered',
      deviceName: 'YubiKey',
    };
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

