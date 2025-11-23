'use client';

import { OCTGuard } from '@/components/OCTGuard';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function WizardPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/wizard/company');
  }, [router]);

  return (
    <OCTGuard>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Redirecting...</p>
        </div>
      </div>
    </OCTGuard>
  );
}

