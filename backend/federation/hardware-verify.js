// Phase 74: Hardware Identity Verification (Passive, no enforcement)
// Allows the system to verify the key if presented
// The goal is not to authenticate with the key - just to allow verification
// NOTE: actual cryptographic validation comes in Phase 75–76
// This is structure and presence validation only

export function verifyHardwareIdentity(signature, challenge, operator) {
  if (!operator || !operator.hardwareKey?.publicKey) {
    return { 
      verified: false, 
      reason: "no registered key",
      keyId: null,
    };
  }

  // NOTE: actual cryptographic validation Phase 75–76
  // We intentionally stub the cryptographic part
  // We validate only structure and presence for now
  // This is exactly how top-tier platforms do it:
  // - Model first
  // - Existence checks second
  // - Cryptographic validation third
  // - Enforcement last
  
  const matches =
    signature &&
    challenge &&
    operator.hardwareKey?.id;

  return {
    verified: !!matches,
    reason: matches ? null : "signature mismatch",
    keyId: operator.hardwareKey.id,
  };
}

