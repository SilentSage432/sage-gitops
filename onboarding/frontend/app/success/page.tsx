'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, QrCode, X, LayoutDashboard } from 'lucide-react';
import { OCTGuard } from '@/components/OCTGuard';
import { QRCodeSVG } from 'qrcode.react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function SuccessPage() {
  const router = useRouter();
  const [showQRModal, setShowQRModal] = useState(false);
  const [tenantId, setTenantId] = useState<string>('');
  const [fingerprint, setFingerprint] = useState<string>('');
  const [isLoadingFingerprint, setIsLoadingFingerprint] = useState(false);

  const handleEnterDashboard = () => {
    router.push('/dashboard');
  };

  const handleShowQR = () => {
    setShowQRModal(true);
  };

  const handleCloseQR = () => {
    setShowQRModal(false);
  };

  // Fetch tenantId and fingerprint on mount
  useEffect(() => {
    const storedTenantId = localStorage.getItem('lastTenantId');
    if (storedTenantId) {
      setTenantId(storedTenantId);
      fetchFingerprint(storedTenantId);
    }
  }, []);

  const fetchFingerprint = async (tid: string) => {
    setIsLoadingFingerprint(true);
    try {
      const octToken = localStorage.getItem('oct-storage') 
        ? JSON.parse(localStorage.getItem('oct-storage')!).token 
        : '';
      
      const response = await fetch(`${API_BASE_URL}/api/onboarding/bootstrap/meta/${tid}`, {
        headers: {
          'Authorization': `Bearer ${octToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFingerprint(data.fingerprint || '');
      }
    } catch (error) {
      console.error('Failed to fetch fingerprint:', error);
    } finally {
      setIsLoadingFingerprint(false);
    }
  };

  return (
    <OCTGuard>
      <div className="min-h-screen bg-[#0b0c0f] text-white flex items-center justify-center px-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-center fade-in slide-up space-y-8">
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
              {isLoadingFingerprint ? (
                <p className="text-base leading-relaxed text-white/60 text-center">
                  Loading verification data...
                </p>
              ) : fingerprint && tenantId ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <QRCodeSVG
                      value={`${window.location.origin}/api/onboarding/bootstrap/verify?tenantId=${tenantId}&fingerprint=${fingerprint}`}
                      size={200}
                      level="M"
                      includeMargin={true}
                      fgColor="#e2e6ee"
                      bgColor="#0b0c0f"
                    />
                  </div>
                  <p className="text-sm text-white/60 text-center">
                    Scan to verify bootstrap kit activation
                  </p>
                  <div className="p-3 bg-[#0b0c0f] rounded-lg border border-white/10">
                    <p className="text-xs text-white/40 mb-1">Tenant ID:</p>
                    <p className="text-xs font-mono text-white/80 break-all">{tenantId}</p>
                    <p className="text-xs text-white/40 mt-2 mb-1">Fingerprint:</p>
                    <p className="text-xs font-mono text-white/80 break-all">{fingerprint}</p>
                  </div>
                </div>
              ) : (
                <p className="text-base leading-relaxed text-white/60 text-center">
                  QR delivery will be available after bootstrap activation.
                </p>
              )}
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

