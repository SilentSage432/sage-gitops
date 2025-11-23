import { YubiKeyGate } from '@/components/YubiKeyGate';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b0c0f] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-[#e2e6ee]">SAGE Onboarding</h1>
          <p className="text-white/60">Hardware authentication required</p>
        </div>
        <YubiKeyGate />
      </div>
    </div>
  );
}
