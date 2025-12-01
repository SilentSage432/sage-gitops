'use client';

import { useState, useEffect } from 'react';
import { requestWebAuthnChallengeRaw, finishRegistration } from '@/lib/api/auth';
import { startAuthentication } from '@simplewebauthn/browser';
import axios from 'axios';

interface AuthStatus {
  registered: boolean;
  authenticated: boolean;
  operator: string;
}

/**
 * Pure UI component for YubiKey registration and authentication.
 * Does NOT handle routing - AuthGuard handles all routing logic.
 * After successful authentication, triggers a page refresh so AuthGuard can route correctly.
 */
export function YubiKeyGate() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [actionStatus, setActionStatus] = useState<'idle' | 'registering' | 'authenticating' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Fetch current auth status to determine what UI to show
  useEffect(() => {
    let isMounted = true;

    async function fetchStatus() {
      if (!isMounted) {
        return;
      }

      try {
        const res = await fetch("/api/auth/status", {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!isMounted) {
          return;
        }
        
        if (!res.ok) {
          throw new Error(`Status check failed: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        
        if (!isMounted) {
          return;
        }
        
        const status: AuthStatus = {
          registered: data.registered === true,
          authenticated: data.authenticated === true,
          operator: data.operator || 'prime',
        };
        
        setAuthStatus(status);
      } catch (err) {
        console.error("Failed to check auth status:", err);
        // On error, assume not registered/authenticated
        if (isMounted) {
          setAuthStatus({
            registered: false,
            authenticated: false,
            operator: 'prime',
          });
        }
      }
    }
    
    fetchStatus();
    
    return () => {
      isMounted = false;
    };
  }, []);

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

      // Registration successful - update status to show authenticate button
      setAuthStatus({
        registered: true,
        authenticated: false,
        operator: 'prime',
      });
      setActionStatus('idle');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setActionStatus('error');
    }
  };

  const handleAuthenticate = async () => {
    setActionStatus('authenticating');
    setError(null);

    try {
      // Use verify endpoints for authentication
      const begin = await axios.post("/api/auth/verify/begin", {
        operator: "prime"
      });
      
      const credential = await startAuthentication({
        optionsJSON: begin.data,
      });
      
      const finish = await axios.post("/api/auth/verify", {
        credential,
        operator: "prime",
      });
      
      if (finish.data.status === "verified") {
        // Authentication succeeded - dispatch event for AuthGuard to re-check
        // AuthGuard will handle all routing logic
        window.dispatchEvent(new CustomEvent('auth-status-changed'));
        return;
      } else {
        setError('Authentication failed. Please try again.');
        setActionStatus('error');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setActionStatus('error');
    }
  };

  // If already authenticated, don't show UI (AuthGuard will handle routing)
  // This is a safety check - AuthGuard should have already redirected
  if (authStatus?.registered && authStatus?.authenticated) {
    return null;
  }

  // Show nothing while fetching status (default state is null, not loading)
  // AuthGuard handles showing/not showing this component
  if (authStatus === null) {
    return null;
  }

  // State: Not registered or not authenticated - show YubiKey modal
  return (
    <div className="bg-[#111317] border border-white/10 p-8 max-w-md mx-auto rounded-[14px]">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-[#e2e6ee]">Hardware Authentication Required</h2>
        <p className="text-sm text-white/60">
          Connect your YubiKey to continue
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
        ) : actionStatus === 'authenticating' ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#6366f1]"></div>
            <p className="mt-2 text-sm text-white/60">Authenticating...</p>
          </div>
        ) : (
          <>
            {!authStatus.registered && (
              <button
                onClick={handleRegister}
                disabled={actionStatus !== 'idle'}
                className="w-full px-4 py-3 bg-[#6366f1] hover:bg-[#585ae8] text-white rounded-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Register YubiKey
              </button>
            )}
            {authStatus.registered && !authStatus.authenticated && (
              <button
                onClick={handleAuthenticate}
                disabled={actionStatus !== 'idle'}
                className="w-full px-4 py-3 bg-[#1a1d22] text-white/60 hover:text-white border border-white/10 rounded-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Authenticate with YubiKey
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
