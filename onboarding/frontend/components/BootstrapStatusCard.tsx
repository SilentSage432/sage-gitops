'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Download, CheckCircle2 } from 'lucide-react';

interface BootstrapStatusCardProps {
  fingerprint?: string;
}

type ActivationStatus = 'pending activation' | 'awaiting first check-in' | 'active' | 'expired';

const STORAGE_KEY = 'bootstrap-status';
const STORAGE_FINGERPRINT_KEY = 'bootstrap-fingerprint';
const STORAGE_TIMER_KEY = 'bootstrap-timer-start';

export function BootstrapStatusCard({ fingerprint }: BootstrapStatusCardProps) {
  // Initialize from localStorage or defaults
  const getInitialStatus = (): ActivationStatus => {
    if (typeof window === 'undefined') return 'pending activation';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['pending activation', 'awaiting first check-in', 'active', 'expired'].includes(stored)) {
      return stored as ActivationStatus;
    }
    // If no stored status, initialize as pending
    localStorage.setItem(STORAGE_KEY, 'pending activation');
    return 'pending activation';
  };

  const [status, setStatus] = useState<ActivationStatus>(() => {
    if (typeof window === 'undefined') return 'pending activation';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['pending activation', 'awaiting first check-in', 'active', 'expired'].includes(stored)) {
      return stored as ActivationStatus;
    }
    // If no stored status, initialize as pending
    localStorage.setItem(STORAGE_KEY, 'pending activation');
    return 'pending activation';
  });
  const [timeRemaining, setTimeRemaining] = useState<number>(15 * 60); // 15 minutes in seconds
  const [fingerprintCopied, setFingerprintCopied] = useState(false);
  const [commandCopied, setCommandCopied] = useState(false);
  const [displayFingerprint, setDisplayFingerprint] = useState<string>('');

  // Initialize fingerprint from localStorage or generate new
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const stored = localStorage.getItem(STORAGE_FINGERPRINT_KEY);
    if (stored) {
      setDisplayFingerprint(stored);
      return;
    }
    
    const generated = fingerprint || 'sha256:' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    localStorage.setItem(STORAGE_FINGERPRINT_KEY, generated);
    setDisplayFingerprint(generated);
  }, [fingerprint]);

  // Initialize timer from localStorage or start new
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (status === 'active' || status === 'expired') return;
    
    const timerStart = localStorage.getItem(STORAGE_TIMER_KEY);
    if (timerStart) {
      const elapsed = Math.floor((Date.now() - parseInt(timerStart)) / 1000);
      const remaining = Math.max(0, 15 * 60 - elapsed);
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        setStatus('expired');
        localStorage.setItem(STORAGE_KEY, 'expired');
      }
    } else {
      localStorage.setItem(STORAGE_TIMER_KEY, Date.now().toString());
    }
  }, [status]);

  // Auto-transition: pending → awaiting after 5 seconds (only if still in pending state)
  useEffect(() => {
    if (status !== 'pending activation') return;
    
    // Check if we've already transitioned (stored in localStorage)
    const storedStatus = localStorage.getItem(STORAGE_KEY);
    if (storedStatus === 'awaiting first check-in' || storedStatus === 'active' || storedStatus === 'expired') {
      return;
    }

    const timer = setTimeout(() => {
      setStatus((currentStatus) => {
        if (currentStatus === 'pending activation') {
          localStorage.setItem(STORAGE_KEY, 'awaiting first check-in');
          return 'awaiting first check-in';
        }
        return currentStatus;
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [status]);

  // Countdown timer
  useEffect(() => {
    if (status === 'expired' || status === 'active') return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setStatus('expired');
          localStorage.setItem(STORAGE_KEY, 'expired');
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
      case 'active':
        return <Badge variant="default" className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30">Active</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="bg-red-500/20 text-red-500 border-red-500/30">Expired</Badge>;
      case 'awaiting first check-in':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Awaiting Check-in</Badge>;
      default:
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Pending Activation</Badge>;
    }
  };

  // Get status description text
  const getStatusDescription = (): string => {
    switch (status) {
      case 'pending activation':
        return 'Kit generated and awaiting delivery';
      case 'awaiting first check-in':
        return 'Bootstrap detected — waiting for first agent signal';
      case 'active':
        return 'Tenant successfully initialized';
      case 'expired':
        return 'Bootstrap expired — regenerate required';
      default:
        return '';
    }
  };

  // Handle manual activation
  const handleMarkAsActivated = () => {
    setStatus('active');
    localStorage.setItem(STORAGE_KEY, 'active');
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
        {status !== 'expired' && status !== 'active' && (
          <div>
            <p className="text-sm text-white/60 mb-1">Expires in:</p>
            <p className="text-lg font-mono font-semibold text-white/80">
              {formatTime(timeRemaining)}
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
            (status === 'pending activation' || status === 'awaiting first check-in') && (
              <Button
                variant="outline"
                className="w-full justify-start"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Kit
              </Button>
            )
          )}

          {/* Copy Verify Command - Always available */}
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

          {/* Mark as Activated Button - Only show when awaiting */}
          {status === 'awaiting first check-in' && (
            <Button
              variant="default"
              className="w-full justify-start"
              onClick={handleMarkAsActivated}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark as Activated
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

