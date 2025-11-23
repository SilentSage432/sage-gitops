'use client';

import { OCTGuard } from '@/components/OCTGuard';
import { InitiatorBadge } from '@/components/InitiatorBadge';
import { useRouter } from 'next/navigation';

export default function InitiatorPage() {
  const router = useRouter();

  return (
    <OCTGuard>
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Initiator Dashboard</h1>
            <p className="text-gray-600">Operator capability token active</p>
          </div>

          <InitiatorBadge />

          <div className="glass p-8 mb-6">
            <h2 className="text-xl font-semibold mb-4">Ready to Begin Onboarding</h2>
            <p className="text-gray-600 mb-6">
              Your YubiKey has been authenticated and an Operator Capability Token (OCT) has been issued.
              Proceed to the wizard to configure your SAGE deployment.
            </p>
            <button
              onClick={() => router.push('/wizard')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Onboarding Wizard
            </button>
          </div>
        </div>
      </div>
    </OCTGuard>
  );
}

