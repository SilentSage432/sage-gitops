'use client';

import { useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import axios from 'axios';

/**
 * Pure UI component for YubiKey authentication.
 * No routing logic - layout.tsx handles all routing.
 * Dispatches 'auth-status-changed' event after successful authentication.
 */
export function YubiKeyAuth() {
  const [actionStatus, setActionStatus] = useState<'idle' | 'authenticating' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

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
        // Authentication succeeded - dispatch event for layout to re-check and route
        setActionStatus('idle');
        window.dispatchEvent(new CustomEvent('auth-status-changed'));
      } else {
        setError('Authentication failed. Please try again.');
        setActionStatus('error');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setActionStatus('error');
    }
  };

  return (
    <div className="bg-[#111317] border border-white/10 p-8 max-w-md mx-auto rounded-[14px]">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-[#e2e6ee]">Authenticate with YubiKey</h2>
        <p className="text-sm text-white/60">
          Connect your YubiKey to authenticate
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-[#1a1d22] rounded-[14px] border border-white/10">
          <p className="text-sm text-white/80">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {actionStatus === 'authenticating' ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#6366f1]"></div>
            <p className="mt-2 text-sm text-white/60">Authenticating...</p>
          </div>
        ) : (
          <button
            onClick={handleAuthenticate}
            disabled={actionStatus !== 'idle'}
            className="w-full px-4 py-3 bg-[#1a1d22] text-white/60 hover:text-white border border-white/10 rounded-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Authenticate with YubiKey
          </button>
        )}
      </div>
    </div>
  );
}

