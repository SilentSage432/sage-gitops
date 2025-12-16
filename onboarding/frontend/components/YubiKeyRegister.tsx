'use client';

import { useState } from 'react';
import { requestWebAuthnChallengeRaw, finishRegistration } from '@/lib/api/auth';

/**
 * Pure UI component for YubiKey registration.
 * No routing logic - layout.tsx handles all routing.
 * Dispatches 'auth-status-changed' event after successful registration.
 */
export function YubiKeyRegister() {
  const [actionStatus, setActionStatus] = useState<'idle' | 'registering' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    setActionStatus('registering');
    setError(null);

    try {
      // Get challenge - must be in click handler before navigator.credentials.create()
      const challengeResponse = await requestWebAuthnChallengeRaw();
      
      // Helper function to convert base64url string to ArrayBuffer
      function base64urlToBuffer(base64url: string): ArrayBuffer {
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const binary = atob(padded);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
      }
      
      // Prepare publicKey options - convert challenge and user.id to ArrayBuffer
      const publicKey = { ...challengeResponse.publicKey };
      
      // Convert challenge to ArrayBuffer (required for Chrome)
      if (typeof publicKey.challenge === 'string') {
        publicKey.challenge = base64urlToBuffer(publicKey.challenge);
      }
      
      // Convert user.id to ArrayBuffer (required for Chrome)
      if (publicKey.user && typeof publicKey.user.id === 'string') {
        publicKey.user = {
          ...publicKey.user,
          id: base64urlToBuffer(publicKey.user.id),
        };
      }
      
      // Call navigator.credentials.create() directly in click handler (required for Safari/iOS)
      const credential = await navigator.credentials.create({
        publicKey,
      }) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error('No credential returned from authenticator');
      }

      // Finish registration by sending credential to backend
      const result = await finishRegistration(credential);
      
      if (!result.success) {
        setError('WebAuthn registration failed. Please ensure you have a YubiKey connected.');
        setActionStatus('error');
        return;
      }

      // Registration successful - dispatch event for layout to re-check and route
      setActionStatus('idle');
      window.dispatchEvent(new CustomEvent('auth-status-changed'));
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setActionStatus('error');
    }
  };

  return (
    <div className="bg-[#111317] border border-white/10 p-8 max-w-md mx-auto rounded-[14px]">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-[#e2e6ee]">Register YubiKey</h2>
        <p className="text-sm text-white/60">
          Connect your YubiKey to register
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-[#1a1d22] rounded-[14px] border border-white/10">
          <p className="text-sm text-white/80">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {actionStatus === 'registering' ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#6366f1]"></div>
            <p className="mt-2 text-sm text-white/60">Registering device...</p>
          </div>
        ) : (
          <button
            onClick={handleRegister}
            disabled={actionStatus !== 'idle'}
            className="w-full px-4 py-3 bg-[#6366f1] hover:bg-[#585ae8] text-white rounded-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Register YubiKey
          </button>
        )}
      </div>
    </div>
  );
}



