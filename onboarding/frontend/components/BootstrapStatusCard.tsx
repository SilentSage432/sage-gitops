'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Download } from 'lucide-react';
import { useBootstrapStatus } from '@/lib/useBootstrapStatus';
import { getTenantId } from '@/lib/onboarding/getTenantId';

interface BootstrapStatusCardProps {
  fingerprint?: string;
}

type ActivationStatus = 'pending' | 'verified' | 'expired';

export function BootstrapStatusCard({ fingerprint }: BootstrapStatusCardProps) {
  const tenantId = getTenantId();
  const { data: bootstrapStatus, isLoading } = useBootstrapStatus(tenantId);
  
  const [fingerprintCopied, setFingerprintCopied] = useState(false);
  const [commandCopied, setCommandCopied] = useState(false);

  // Determine status from API data (Phase 9)
  const getStatus = (): ActivationStatus => {
    if (!bootstrapStatus) return 'pending';
    if (bootstrapStatus.activated) return 'verified';
    if (bootstrapStatus.expiresAt && new Date(bootstrapStatus.expiresAt) < new Date()) {
      return 'expired';
    }
    return 'pending';
  };

  const status = getStatus();
  const displayFingerprint = bootstrapStatus?.fingerprint || fingerprint || '';

  // Calculate time remaining until expiry
  const getTimeRemaining = (): number => {
    if (!bootstrapStatus?.expiresAt) return 0;
    const expires = new Date(bootstrapStatus.expiresAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((expires - now) / 1000));
  };

  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining);

  // Update time remaining
  useEffect(() => {
    if (status === 'expired' || status === 'verified') return;

    const interval = setInterval(() => {
      const remaining = getTimeRemaining();
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [bootstrapStatus, status]);

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status badge variant and color (Phase 9)
  const getStatusBadge = () => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30">Verified ✓</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="bg-red-500/20 text-red-500 border-red-500/30">Expired</Badge>;
      default:
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Pending Verification</Badge>;
    }
  };

  // Get status description text (Phase 9)
  const getStatusDescription = (): string => {
    switch (status) {
      case 'pending':
        return 'Kit generated and awaiting verification';
      case 'verified':
        return bootstrapStatus?.activatedAt 
          ? `Verified on ${new Date(bootstrapStatus.activatedAt).toLocaleString()}`
          : 'Tenant successfully verified';
      case 'expired':
        return 'Bootstrap expired — regenerate required';
      default:
        return '';
    }
  };

  const handleCopyFingerprint = async () => {
    if (!displayFingerprint) return;
    try {
      await navigator.clipboard.writeText(displayFingerprint);
      setFingerprintCopied(true);
      setTimeout(() => setFingerprintCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy fingerprint:', err);
    }
  };

  const handleCopyVerifyCommand = async () => {
    if (!displayFingerprint) return;
    const command = `sage verify-kit --fingerprint "${displayFingerprint}"`;
    try {
      await navigator.clipboard.writeText(command);
      setCommandCopied(true);
      setTimeout(() => setCommandCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy command:', err);
    }
  };

  const handleDownloadKit = async () => {
    try {
      // Get tenantId from localStorage or URL
      const urlParams = new URLSearchParams(window.location.search);
      const tenantId = urlParams.get('tenantId') || localStorage.getItem('lastTenantId') || '';

      if (!tenantId) {
        alert('No tenant ID available. Please complete onboarding first.');
        return;
      }

      // Use shared download utility
      const { downloadBootstrapKit } = await import('@/lib/downloadKit');
      await downloadBootstrapKit(tenantId);

      // Status will be updated by useBootstrapStatus hook
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download bootstrap kit: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bootstrap Kit</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Description */}
        <div>
          <p className="text-sm text-white/60">{getStatusDescription()}</p>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <p className="text-sm text-white/60">Loading status...</p>
        )}

        {/* Fingerprint */}
        {displayFingerprint && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-white/60">Fingerprint:</p>
              <Button
                onClick={handleCopyFingerprint}
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
              >
                {fingerprintCopied ? (
                  <>
                    <Check className="w-3 h-3 mr-1 text-[#10b981]" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <code className="text-xs font-mono text-[#e2e6ee] break-all block bg-[#0b0c0f] p-2 rounded border border-white/5">
              {displayFingerprint}
            </code>
          </div>
        )}

        {/* Expiry Countdown */}
        {status !== 'expired' && status !== 'verified' && timeRemaining > 0 && (
          <div>
            <p className="text-sm text-white/60 mb-1">Expires in:</p>
            <p className="text-lg font-mono font-semibold text-white/80">
              {formatTime(timeRemaining)}
            </p>
          </div>
        )}

        {/* Activation Timestamp */}
        {status === 'verified' && bootstrapStatus?.activatedAt && (
          <div>
            <p className="text-sm text-white/60 mb-1">Activated:</p>
            <p className="text-sm font-mono text-white/80">
              {new Date(bootstrapStatus.activatedAt).toLocaleString()}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          {/* Download Kit Button */}
          {status === 'expired' ? (
            <Button
              variant="outline"
              className="w-full justify-start opacity-50"
              disabled
            >
              <Download className="w-4 h-4 mr-2" />
              Download Kit
            </Button>
          ) : (
            status === 'pending' && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleDownloadKit}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Kit
              </Button>
            )
          )}

          {/* Copy Verify Command - Show when fingerprint available */}
          {displayFingerprint && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleCopyVerifyCommand}
            >
              {commandCopied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-[#10b981]" />
                  Command Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Verify Command
                </>
              )}
            </Button>
          )}

          {/* Regenerate Button - Only show when expired */}
          {status === 'expired' && (
            <Button
              variant="outline"
              className="w-full justify-start opacity-50"
              disabled
            >
              Regenerate (future)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
