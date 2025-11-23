'use client';

import { useState } from 'react';
import { performWebAuthnRegistration, performWebAuthnAuthentication, issueOCT } from '@/lib/api/auth';
import { storeOCT } from '@/lib/api/oct';
import { useRouter } from 'next/navigation';

export function YubiKeyGate() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'registering' | 'authenticating' | 'success' | 'error'>('idle');
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async () => {
    setStatus('registering');
    setError(null);

    try {
      const result = await performWebAuthnRegistration();
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

  return (
    <div className="glass p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold mb-2">Hardware Authentication Required</h2>
        <p className="text-sm text-gray-600">
          Connect your YubiKey to continue
        </p>
      </div>

      {status === 'success' && deviceName && (
        <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-800">
            ✅ Authenticated with {deviceName}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {status === 'idle' && (
          <>
            <button
              onClick={handleRegister}
              disabled={status !== 'idle'}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Register YubiKey
            </button>
            <button
              onClick={handleAuthenticate}
              disabled={status !== 'idle'}
              className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Authenticate with YubiKey
            </button>
          </>
        )}

        {(status === 'registering' || status === 'authenticating' || status === 'checking') && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">
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

