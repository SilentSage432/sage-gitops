import { YubiKeyGate } from '@/components/YubiKeyGate';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">SAGE Onboarding</h1>
          <p className="text-gray-600">Hardware authentication required</p>
        </div>
        <YubiKeyGate />
      </div>
    </div>
  );
}
