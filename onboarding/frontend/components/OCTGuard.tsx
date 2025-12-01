'use client';

import { useEffect, useState } from 'react';
import { isOCTValid } from '@/lib/api/oct';

/**
 * OCTGuard - checks OCT validity but does NOT handle routing.
 * AuthGuard handles all routing logic.
 * This component only controls whether to show/hide content based on OCT validity.
 */
export function OCTGuard({ children }: { children: React.ReactNode }) {
  const [valid, setValid] = useState<boolean | null>(null);

  // DEV BYPASS: allows UI development without hardware
  if (process.env.NEXT_PUBLIC_BYPASS_YUBIKEY === "true") {
    return <>{children}</>;
  }

  useEffect(() => {
    const checkOCT = () => {
      const valid = isOCTValid();
      setValid(valid);
    };

    checkOCT();
    const interval = setInterval(checkOCT, 5000);

    return () => clearInterval(interval);
  }, []);

  // Default state is null (not loading) until check completes
  if (valid === null) {
    return null;
  }

  // If OCT is invalid, don't show content (but don't redirect - AuthGuard handles routing)
  if (!valid) {
    return null;
  }

  return <>{children}</>;
}

