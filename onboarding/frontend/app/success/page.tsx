'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, QrCode, X, LayoutDashboard } from 'lucide-react';
import { OCTGuard } from '@/components/OCTGuard';

export default function SuccessPage() {
  const router = useRouter();
  const [showQRModal, setShowQRModal] = useState(false);

  const handleEnterDashboard = () => {
    router.push('/dashboard');
  };

  const handleShowQR = () => {
    setShowQRModal(true);
  };

  const handleCloseQR = () => {
    setShowQRModal(false);
  };

  return (
    <OCTGuard>
      <div className="min-h-screen bg-[#0b0c0f] text-white flex items-center justify-center px-4">
        <div className="max-w-3xl mx-auto py-10 px-4 text-center fade-in slide-up">
          <Card className="bg-[#0e0e12]/70 border border-white/15 backdrop-blur-2xl rounded-2xl shadow-[0_0_32px_-12px_rgba(0,0,0,0.85)]">
            <CardContent className="p-6 space-y-4">
              {/* Success Icon */}
              <div className="flex justify-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              </div>

              {/* Hero Message */}
              <h1 className="text-3xl font-semibold tracking-tight text-[#e2e6ee]">
                Welcome to SAGE Federation
              </h1>
              <p className="text-base leading-relaxed text-white/60">
                Your environment has been successfully initialized.
              </p>

              {/* Primary CTA */}
              <div className="space-y-3">
                <Button
                  onClick={handleEnterDashboard}
                  className="w-full px-6 py-3 text-base"
                  size="lg"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Enter Dashboard
                </Button>

                <Button
                  onClick={handleShowQR}
                  variant="outline"
                  className="w-full px-6 py-3 text-base"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Show QR Handoff
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR Modal */}
      {showQRModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleCloseQR}
        >
          <Card
            className="border-white/10 bg-[#111317] max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium text-[#e2e6ee]">QR Handoff</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseQR}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-base leading-relaxed text-white/60 text-center">
                QR delivery will be available after bootstrap activation.
              </p>
              <Button
                onClick={handleCloseQR}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </OCTGuard>
  );
}

