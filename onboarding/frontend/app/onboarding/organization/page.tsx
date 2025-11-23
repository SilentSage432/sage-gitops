'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrganizationOnboardingPage() {
  const router = useRouter();

  // Redirect to the existing organization flow
  useEffect(() => {
    router.replace('/onboarding/company');
  }, [router]);

  return null;
}

