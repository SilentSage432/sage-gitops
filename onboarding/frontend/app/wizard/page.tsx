'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect legacy wizard to modern onboarding flow
export default function WizardPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/onboarding/company');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0b0c0f] flex items-center justify-center text-white">
      <p>Redirecting to modern onboarding flow...</p>
    </div>
  );
}
