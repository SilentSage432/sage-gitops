// Phase 75: WebAuthn Challenge Flow (Still Passive)
// UI component for hardware key verification via WebAuthn
// No gating, no lockout, no auth - simply verification plumbing

import React, { useState } from "react";

export function HardwareKeyVerification() {
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{ verified: boolean; keyId: string | null } | null>(null);

  async function verifyKey() {
    setVerifying(true);
    setResult(null);

    try {
      // Step 1: Get challenge from backend
      const challengeResp = await fetch("/api/operator/hardware/challenge");
      if (!challengeResp.ok) {
        throw new Error("Failed to get challenge");
      }
      const { challenge } = await challengeResp.json();

      // Step 2: Request WebAuthn signature from browser/hardware key
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: Uint8Array.from(atob(challenge), (c) => c.charCodeAt(0)),
          userVerification: "required",
        },
      }) as PublicKeyCredential;

      if (!credential || !credential.response) {
        throw new Error("No credential response from hardware key");
      }

      // Step 3: Extract signature from WebAuthn response
      const authenticatorResponse = credential.response as AuthenticatorAssertionResponse;
      const signatureArray = new Uint8Array(authenticatorResponse.signature);
      const signature = btoa(String.fromCharCode(...signatureArray));

      // Step 4: Validate with backend
      const validateResp = await fetch("/api/operator/hardware/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          challenge,
          signature,
        }),
      });

      if (!validateResp.ok) {
        throw new Error("Validation failed");
      }

      const validationResult = await validateResp.json();
      setResult({
        verified: validationResult.verified || false,
        keyId: validationResult.keyId || null,
      });
    } catch (error) {
      console.error("Hardware key verification error:", error);
      setResult({
        verified: false,
        keyId: null,
      });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="text-xs space-y-2">
      <button
        onClick={verifyKey}
        disabled={verifying}
        className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded transition-colors"
      >
        {verifying ? "Verifying..." : "Verify Hardware Key"}
      </button>
      {result && (
        <div className="text-xs">
          {result.verified ? (
            <span className="text-green-500">✓ Verified</span>
          ) : (
            <span className="text-red-500">✗ Verification failed</span>
          )}
          {result.keyId && (
            <span className="text-slate-400 ml-2 font-mono">({result.keyId})</span>
          )}
        </div>
      )}
    </div>
  );
}

