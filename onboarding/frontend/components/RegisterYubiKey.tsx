"use client";

import { useState } from "react";

export default function RegisterYubiKey() {
  const [status, setStatus] = useState("");

  async function register() {
    try {
      setStatus("Requesting challenge...");

      const begin = await fetch("/api/auth/register/begin", {
        method: "POST",
        body: JSON.stringify({ operator: "prime" }),
        headers: { "Content-Type": "application/json" },
      });

      if (!begin.ok) {
        throw new Error("Failed to request challenge");
      }

      const options = await begin.json();

      setStatus("Touch the YubiKey…");

      const cred = await navigator.credentials.create({
        publicKey: options.publicKey,
      }) as PublicKeyCredential | null;

      if (!cred) {
        throw new Error("No credential returned from YubiKey");
      }

      setStatus("Sending credential…");

      // Serialize the credential for sending to backend
      // The go-webauthn library expects the credential in a specific format
      const credentialResponse = cred.response as AuthenticatorAttestationResponse;
      
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

      // Format credential in the structure expected by go-webauthn
      const credentialJson = {
        id: cred.id,
        rawId: arrayBufferToBase64Url(cred.rawId),
        type: cred.type,
        response: {
          clientDataJSON: arrayBufferToBase64Url(credentialResponse.clientDataJSON),
          attestationObject: arrayBufferToBase64Url(credentialResponse.attestationObject),
        },
      };

      const result = await fetch("/api/auth/register/finish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operator: "prime",
          credential: credentialJson,
        }),
      });

      if (!result.ok) {
        const errorData = await result.json().catch(() => ({ error: "Registration failed" }));
        throw new Error(errorData.error || "Registration failed");
      }

      const data = await result.json();
      setStatus(`Success: ${data.status}`);
    } catch (error: any) {
      setStatus(`Error: ${error.message || "Registration failed"}`);
      console.error("YubiKey registration error:", error);
    }
  }

  return (
    <div>
      <button
        className="px-4 py-2 border border-white"
        onClick={register}
      >
        Register YubiKey
      </button>
      <p>{status}</p>
    </div>
  );
}

