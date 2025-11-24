'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, QrCode, X } from 'lucide-react';
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
      <div className="min-h-screen bg-[#0b0c0f] text-white flex items-center justify-center px-4 animate-in fade-in duration-700">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <Card className="border-white/10 bg-[#111317]">
            <CardContent className="pt-8 pb-8 px-8">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              </div>

              {/* Hero Message */}
              <h1 className="text-3xl font-semibold mb-3 text-[#e2e6ee]">
                Welcome to SAGE Federation
              </h1>
              <p className="text-white/60 mb-8">
                Your environment has been successfully initialized.
              </p>

              {/* Primary CTA */}
              <div className="space-y-3">
                <Button
                  onClick={handleEnterDashboard}
                  className="w-full px-6 py-3 text-base"
                  size="lg"
                >
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
            <CardContent className="pt-6 pb-6 px-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#e2e6ee]">QR Handoff</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseQR}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-white/60 text-center py-8">
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

