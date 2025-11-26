'use client';

import { OCTGuard } from '@/components/OCTGuard';
import { InitiatorBadge } from '@/components/InitiatorBadge';
import { useRouter } from 'next/navigation';

export default function InitiatorPage() {
  const router = useRouter();

  return (
    <OCTGuard>
      <div className="min-h-screen bg-[#0b0c0f] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-[#e2e6ee]">Initiator Dashboard</h1>
            <p className="text-white/60">Operator capability token active</p>
          </div>

          <InitiatorBadge />

          <div className="bg-[#111317] border border-white/10 p-8 mb-6 rounded-[14px]">
            <h2 className="text-xl font-semibold mb-4 text-[#e2e6ee]">Ready to Begin Onboarding</h2>
            <p className="text-white/60 mb-6">
              Your YubiKey has been authenticated and an Operator Capability Token (OCT) has been issued.
              Proceed to configure your SAGE deployment.
            </p>
            <button
              onClick={() => router.push('/onboarding/company')}
              className="px-6 py-3 bg-[#6366f1] text-white rounded-[14px] hover:bg-[#585ae8] transition-colors"
            >
              Start Onboarding
            </button>
          </div>
        </div>
      </div>
    </OCTGuard>
  );
}

