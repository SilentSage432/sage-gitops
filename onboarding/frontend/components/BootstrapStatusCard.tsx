'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Download } from 'lucide-react';

interface BootstrapStatusCardProps {
  fingerprint?: string;
}

export function BootstrapStatusCard({ fingerprint }: BootstrapStatusCardProps) {
  const [status, setStatus] = useState<'pending' | 'activated' | 'expired'>('pending');
  const [timeRemaining, setTimeRemaining] = useState<number>(15 * 60); // 15 minutes in seconds
  const [fingerprintCopied, setFingerprintCopied] = useState(false);
  const [commandCopied, setCommandCopied] = useState(false);

  // Mock fingerprint if not provided
  const displayFingerprint = fingerprint || 'sha256:' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Mock expiry timestamp (15 minutes from now)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Countdown timer
  useEffect(() => {
    if (status === 'expired') return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  // Format time remaining as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status badge variant and color
  const getStatusBadge = () => {
    switch (status) {
      case 'activated':
        return <Badge variant="default" className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30">Activated</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="bg-red-500/20 text-red-500 border-red-500/30">Expired</Badge>;
      default:
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Pending Activation</Badge>;
    }
  };

  const handleCopyFingerprint = async () => {
    try {
      await navigator.clipboard.writeText(displayFingerprint);
      setFingerprintCopied(true);
      setTimeout(() => setFingerprintCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy fingerprint:', err);
    }
  };

  const handleCopyVerifyCommand = async () => {
    const command = `sage verify-kit --fingerprint "${displayFingerprint}"`;
    try {
      await navigator.clipboard.writeText(command);
      setCommandCopied(true);
      setTimeout(() => setCommandCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy command:', err);
    }
  };

  return (
    <Card className="border-white/10 bg-[#111317]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bootstrap Kit</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fingerprint */}
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

        {/* Expiry Countdown */}
        {status !== 'expired' && (
          <div>
            <p className="text-sm text-white/60 mb-1">Expires in:</p>
            <p className="text-lg font-mono font-semibold text-white/80">
              {formatTime(timeRemaining)}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <Button
            variant="outline"
            className="w-full justify-start"
            disabled={status === 'expired'}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Kit
          </Button>
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
          {status === 'expired' && (
            <Button
              variant="outline"
              className="w-full justify-start opacity-50"
              disabled
            >
              Regenerate Kit (Coming Soon)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

