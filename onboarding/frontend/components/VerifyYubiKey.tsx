"use client";

import { useState } from "react";

export default function VerifyYubiKey() {
  const [status, setStatus] = useState("");

  async function verify() {
    try {
      setStatus("Requesting challenge…");

      const begin = await fetch("/api/auth/verify/begin", {
        method: "POST",
        body: JSON.stringify({ operator: "prime" }),
        headers: { "Content-Type": "application/json" },
      });

      if (!begin.ok) {
        throw new Error("Failed to request challenge");
      }

      const options = await begin.json();

      setStatus("Touch YubiKey…");

      const assertion = await navigator.credentials.get({
        publicKey: options.publicKey,
      }) as PublicKeyCredential | null;

      if (!assertion) {
        throw new Error("No assertion returned from YubiKey");
      }

      setStatus("Sending…");

      // Serialize the assertion for sending to backend
      const assertionResponse = assertion.response as AuthenticatorAssertionResponse;
      
      // Helper to convert ArrayBuffer to base64url (WebAuthn standard)
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

      // Format assertion in the structure expected by go-webauthn
      const assertionJson = {
        id: assertion.id,
        rawId: arrayBufferToBase64Url(assertion.rawId),
        type: assertion.type,
        response: {
          clientDataJSON: arrayBufferToBase64Url(assertionResponse.clientDataJSON),
          authenticatorData: arrayBufferToBase64Url(assertionResponse.authenticatorData),
          signature: arrayBufferToBase64Url(assertionResponse.signature),
          userHandle: assertionResponse.userHandle ? arrayBufferToBase64Url(assertionResponse.userHandle) : null,
        },
      };

      const result = await fetch("/api/auth/verify/finish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operator: "prime",
          credential: assertionJson,
        }),
      });

      if (!result.ok) {
        const errorData = await result.json().catch(() => ({ error: "Verification failed" }));
        throw new Error(errorData.error || "Verification failed");
      }

      const data = await result.json();
      setStatus(`Verified: ${data.identity}`);
    } catch (error: any) {
      setStatus(`Error: ${error.message || "Verification failed"}`);
      console.error("YubiKey verification error:", error);
    }
  }

  return (
    <div>
      <button
        className="px-4 py-2 border border-white"
        onClick={verify}
      >
        Verify YubiKey
      </button>
      <p>{status}</p>
    </div>
  );
}

