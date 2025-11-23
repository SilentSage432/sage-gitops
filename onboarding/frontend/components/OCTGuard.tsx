'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isOCTValid } from '@/lib/api/oct';

export function OCTGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [valid, setValid] = useState<boolean | null>(null);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!valid) {
    return null;
  }

  return <>{children}</>;
}

