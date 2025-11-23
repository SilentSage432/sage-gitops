'use client';

import { OCTGuard } from '@/components/OCTGuard';
import { KitDeliveryPanel } from '@/components/KitDeliveryPanel';

export default function CompletePage() {
  return (
    <OCTGuard>
      <div className="min-h-screen bg-[#0b0c0f] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-block w-16 h-16 bg-[#10b981] rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2 text-[#e2e6ee]">Onboarding Complete!</h1>
            <p className="text-white/60">Your SAGE deployment has been configured successfully.</p>
          </div>

          <KitDeliveryPanel />
        </div>
      </div>
    </OCTGuard>
  );
}
