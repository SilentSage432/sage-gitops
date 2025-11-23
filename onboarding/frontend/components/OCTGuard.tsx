'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isOCTValid } from '@/lib/api/oct';

export function OCTGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [valid, setValid] = useState<boolean | null>(null);

  // DEV BYPASS: allows UI development without hardware
  if (process.env.NEXT_PUBLIC_BYPASS_YUBIKEY === "true") {
    return <>{children}</>;
  }

  useEffect(() => {
    const checkOCT = () => {
      const valid = isOCTValid();
      setValid(valid);
      
      if (!valid) {
        router.push('/');
      }
    };

    checkOCT();
    const interval = setInterval(checkOCT, 5000);

    return () => clearInterval(interval);
  }, [router]);

  if (valid === null) {
    return (
      <div className="min-h-screen bg-[#0b0c0f] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366f1]"></div>
          <p className="mt-2 text-sm text-white/60">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!valid) {
    return null;
  }

  return <>{children}</>;
}

