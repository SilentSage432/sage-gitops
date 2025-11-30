'use client';

import { useState, useEffect } from 'react';
import { requestWebAuthnChallengeRaw, finishRegistration, performWebAuthnAuthentication, issueOCT } from '@/lib/api/auth';
import { storeOCT } from '@/lib/api/oct';
import { useRouter } from 'next/navigation';

export function YubiKeyGate() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'registering' | 'authenticating' | 'success' | 'error'>('idle');
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // DEV BYPASS: allows UI development without hardware
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_BYPASS_YUBIKEY === "true") {
      // Auto-issue OCT and redirect to onboarding (OCTGuard will also bypass)
      const bypassAuth = async () => {
        try {
          const octResponse = await issueOCT();
          storeOCT({
            token: octResponse.token,
            expiresAt: octResponse.expiresAt,
            scopes: octResponse.scopes,
          });
        } catch (err) {
          // Backend may not be available - store mock token for bypass mode
          console.warn('Bypass: OCT issuance failed (backend may be unavailable), using mock token');
          const mockExpiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes from now
          storeOCT({
            token: "mock-oct-token",
            expiresAt: mockExpiresAt,
            scopes: ["tenant.create", "agent.plan.create", "bootstrap.sign"],
          });
        }
        router.push('/onboarding/select');
      };
      bypassAuth();
    }
  }, [router]);

  const handleRegister = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    setStatus('registering');
    setError(null);

    try {
      // Get challenge - must be in click handler before navigator.credentials.create()
      const challengeResponse = await requestWebAuthnChallengeRaw();
      
      // Convert challenge and user.id to ArrayBuffers if needed (must be done synchronously)
      const publicKeyOptions = { ...challengeResponse.publicKey };
      
      // Convert challenge from base64/base64url to ArrayBuffer if it's a string
      if (typeof publicKeyOptions.challenge === 'string') {
        const base64UrlToUint8Array = (base64url: string): Uint8Array => {
          const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
          const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
          const binary = atob(padded);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          return bytes;
        };
        
        const challengeBytes = base64UrlToUint8Array(publicKeyOptions.challenge);
        publicKeyOptions.challenge = challengeBytes.buffer.slice(
          challengeBytes.byteOffset,
          challengeBytes.byteOffset + challengeBytes.byteLength
        ) as ArrayBuffer;
      }
      
      // Convert user.id to ArrayBuffer if it's a string
      if (publicKeyOptions.user && typeof publicKeyOptions.user.id === 'string') {
        const base64UrlToUint8Array = (base64url: string): Uint8Array => {
          const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
          const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
          const binary = atob(padded);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          return bytes;
        };
        
        const userIdBytes = base64UrlToUint8Array(publicKeyOptions.user.id);
        publicKeyOptions.user = {
          ...publicKeyOptions.user,
          id: userIdBytes.buffer.slice(
            userIdBytes.byteOffset,
            userIdBytes.byteOffset + userIdBytes.byteLength
          ) as ArrayBuffer,
        };
      }
      
      // Call navigator.credentials.create() directly in click handler (required for Safari/iOS)
      // This MUST be called synchronously within the click gesture context
      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions,
      }) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error('No credential returned from authenticator');
      }

      // Finish registration by sending credential to backend
      const result = await finishRegistration(credential);
      
      if (result.success) {
        setDeviceName(result.deviceName || 'YubiKey');
        setStatus('authenticating');
        
        // After successful registration, issue OCT
        try {
          const octResponse = await issueOCT();
          storeOCT({
            token: octResponse.token,
            expiresAt: octResponse.expiresAt,
            scopes: octResponse.scopes,
          });
          
          setStatus('success');
          setTimeout(() => {
            router.push('/initiator');
          }, 1500);
        } catch (octError) {
          setError('Registration successful but failed to issue access token');
          setStatus('error');
        }
      } else {
        setError('WebAuthn registration failed. Please ensure you have a YubiKey connected.');
        setStatus('error');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setStatus('error');
    }
  };

  const handleAuthenticate = async () => {
    setStatus('authenticating');
    setError(null);

    try {
      const result = await performWebAuthnAuthentication();
      if (result.success) {
        setDeviceName(result.deviceName || 'YubiKey');
        
        // Issue OCT after successful authentication
        try {
          const octResponse = await issueOCT();
          storeOCT({
            token: octResponse.token,
            expiresAt: octResponse.expiresAt,
            scopes: octResponse.scopes,
          });
          
          setStatus('success');
          setTimeout(() => {
            router.push('/initiator');
          }, 1500);
        } catch (octError) {
          setError('Authentication successful but failed to issue access token');
          setStatus('error');
        }
      } else {
        setError('Authentication failed. Please try again.');
        setStatus('error');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setStatus('error');
    }
  };

  // DEV BYPASS: Skip rendering gate UI if bypass is enabled
  if (process.env.NEXT_PUBLIC_BYPASS_YUBIKEY === "true") {
    return null;
  }

  return (
    <div className="bg-[#111317] border border-white/10 p-8 max-w-md mx-auto rounded-[14px]">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-[#e2e6ee]">Hardware Authentication Required</h2>
        <p className="text-sm text-white/60">
          Connect your YubiKey to continue
        </p>
      </div>

      {status === 'success' && deviceName && (
        <div className="mb-4 p-4 bg-[#1a1d22] rounded-[14px] border border-white/10">
          <p className="text-sm text-white/80">
            ✅ Authenticated with {deviceName}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-[#1a1d22] rounded-[14px] border border-white/10">
          <p className="text-sm text-white/80">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {status === 'idle' && (
          <>
            <button
              onClick={handleRegister}
              disabled={status !== 'idle'}
              className="w-full px-4 py-3 bg-[#6366f1] hover:bg-[#585ae8] text-white rounded-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Register YubiKey
            </button>
            <button
              onClick={handleAuthenticate}
              disabled={status !== 'idle'}
              className="w-full px-4 py-3 bg-[#1a1d22] text-white/60 hover:text-white border border-white/10 rounded-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Authenticate with YubiKey
            </button>
          </>
        )}

        {(status === 'registering' || status === 'authenticating' || status === 'checking') && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#6366f1]"></div>
            <p className="mt-2 text-sm text-white/60">
              {status === 'registering' && 'Registering device...'}
              {status === 'authenticating' && 'Authenticating...'}
              {status === 'checking' && 'Checking device...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

