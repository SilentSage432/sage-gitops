'use client';

import { OnboardingEntry } from '@/components/OnboardingEntry';
import { OCTGuard } from '@/components/OCTGuard';

export default function OnboardingSelectPage() {
  return (
    <OCTGuard>
      <OnboardingEntry />
    </OCTGuard>
  );
}

