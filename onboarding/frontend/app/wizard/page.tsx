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
      <div className="min-h-screen bg-[#0b0c0f] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366f1]"></div>
          <p className="mt-2 text-sm text-white/60">Redirecting...</p>
        </div>
      </div>
    </OCTGuard>
  );
}

