'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, LayoutDashboard } from 'lucide-react';
import { useBootstrapStatus } from '@/lib/useBootstrapStatus';
import { getTenantId } from '@/lib/onboarding/getTenantId';

export default function VerifiedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId') || getTenantId();
  const { data: bootstrapStatus, isLoading } = useBootstrapStatus(tenantId);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0b0c0f] text-white flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <CheckCircle2 className="w-24 h-24 text-[#10b981] animate-pulse" />
              <div className="absolute inset-0 bg-[#10b981]/20 rounded-full animate-ping" />
            </div>
          </div>
          <CardTitle className="text-3xl">Bootstrap Kit Verified</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-lg text-white/80">
              Your bootstrap kit has been successfully verified and activated.
            </p>
            {bootstrapStatus?.activatedAt && (
              <p className="text-sm text-white/60">
                Activated on {new Date(bootstrapStatus.activatedAt).toLocaleString()}
              </p>
            )}
          </div>

          {bootstrapStatus?.fingerprint && (
            <div className="p-4 bg-[#1a1d22] rounded-lg border border-white/10">
              <p className="text-xs text-white/60 mb-2">Fingerprint:</p>
              <code className="text-xs font-mono text-white/80 break-all">
                {bootstrapStatus.fingerprint}
              </code>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-[#6366f1] hover:bg-[#585ae8]"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Continue to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

