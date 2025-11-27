'use client';

import { useEffect } from 'react';
import { performFederationHandshake } from '@/lib/federation/handshake';

/**
 * Phase 13.3: Federation Handshake Component
 * Performs federation handshake on client-side mount
 * This is a client component that can be used in server components
 */
export function FederationHandshake() {
  useEffect(() => {
    // Default bootstrap identity for now
    // TODO: Replace with real tenant/node values from onboarding-store
    // TODO: Get bootstrap fingerprint from bootstrap kit metadata
    const nodeId = 'prime-ui';
    const tenantId = 'tenant-master';
    const fingerprint = 'bootstrap-master';

    performFederationHandshake(nodeId, tenantId, fingerprint)
      .then((response) => {
        console.log('Federation handshake successful:', response);
      })
      .catch((err) => {
        console.error('Federation Handshake Failed:', err);
      });
  }, []);

  // This component doesn't render anything
  return null;
}

