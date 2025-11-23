'use client';

import { OCTGuard } from '@/components/OCTGuard';
import { KitDeliveryPanel } from '@/components/KitDeliveryPanel';

export default function CompletePage() {
  return (
    <OCTGuard>
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-block w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Onboarding Complete!</h1>
            <p className="text-gray-600">Your SAGE deployment has been configured successfully.</p>
          </div>

          <KitDeliveryPanel />
        </div>
      </div>
    </OCTGuard>
  );
}

