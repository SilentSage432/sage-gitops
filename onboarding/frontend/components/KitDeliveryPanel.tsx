'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check } from 'lucide-react';
import { getTenantId } from '@/lib/onboarding/getTenantId';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export function KitDeliveryPanel() {
  const [downloading, setDownloading] = useState(false);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [verifyCommand, setVerifyCommand] = useState<string>('');
  const [fingerprintCopied, setFingerprintCopied] = useState(false);
  const tenantId = getTenantId();

  // Fetch meta on mount (Phase 9)
  useEffect(() => {
    if (!tenantId) return;

    const fetchMeta = async () => {
      try {
        const token = localStorage.getItem('oct-storage');
        if (token) {
          const octData = JSON.parse(token);
          const metaResponse = await axios.get(`${API_BASE_URL}/api/onboarding/bootstrap/meta/${tenantId}`, {
            headers: {
              Authorization: `Bearer ${octData.token}`,
            },
          });

          if (metaResponse.data.fingerprint) {
            setFingerprint(metaResponse.data.fingerprint);
          }
          if (metaResponse.data.verifyCommand) {
            setVerifyCommand(metaResponse.data.verifyCommand);
          }
        }
      } catch (err) {
        console.error('Failed to fetch meta:', err);
      }
    };

    fetchMeta();
  }, [tenantId]);

  const handleDownloadKit = async () => {
    setDownloading(true);
    try {
      // Bypass mode: skip API call
      if (process.env.NEXT_PUBLIC_BYPASS_YUBIKEY === 'true') {
        setFingerprint('sha256:mock-fingerprint-bypass-mode');
        setVerifyCommand('sage verify-kit --fingerprint "sha256:mock-fingerprint-bypass-mode"');
        setDownloading(false);
        alert('Bypass mode: Download disabled. Bootstrap kit generation skipped.');
        return;
      }

      if (!tenantId) {
        throw new Error('No tenant ID available');
      }

      // Use shared download utility
      const { downloadBootstrapKit } = await import('@/lib/downloadKit');
      await downloadBootstrapKit(tenantId);

      // Fetch meta again after download
      try {
        const token = localStorage.getItem('oct-storage');
        if (token) {
          const octData = JSON.parse(token);
          const metaResponse = await axios.get(`${API_BASE_URL}/api/onboarding/bootstrap/meta/${tenantId}`, {
            headers: {
              Authorization: `Bearer ${octData.token}`,
            },
          });

          if (metaResponse.data.fingerprint) {
            setFingerprint(metaResponse.data.fingerprint);
          }
          if (metaResponse.data.verifyCommand) {
            setVerifyCommand(metaResponse.data.verifyCommand);
          }
        }
      } catch (err) {
        console.error('Failed to fetch meta:', err);
      }
    } catch (error: any) {
      console.error('Download error:', error);
      alert('Failed to download bootstrap kit: ' + (error.message || 'Unknown error'));
    } finally {
      setDownloading(false);
    }
  };

  const copyFingerprint = async () => {
    if (!fingerprint) return;
    try {
      await navigator.clipboard.writeText(fingerprint);
      setFingerprintCopied(true);
      setTimeout(() => setFingerprintCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy fingerprint:', err);
    }
  };

  const copyVerifyCommand = () => {
    navigator.clipboard.writeText(verifyCommand);
    alert('Verify command copied to clipboard');
  };

  // Generate QR code URL (Phase 9)
  const getQRUrl = (): string => {
    if (!fingerprint) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : API_BASE_URL;
    return `${baseUrl}/api/onboarding/bootstrap/scan?fingerprint=${encodeURIComponent(fingerprint)}`;
  };

  return (
    <div className="bg-[#111317] border border-white/10 p-8 max-w-2xl mx-auto rounded-[14px]">
      <h2 className="text-2xl font-semibold mb-6 text-[#e2e6ee]">Bootstrap Kit Delivery</h2>
      
      <div className="space-y-6">
        <div>
          <button
            onClick={handleDownloadKit}
            disabled={downloading}
            className="w-full px-6 py-3 bg-[#6366f1] text-white rounded-[14px] hover:bg-[#585ae8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {downloading ? 'Downloading...' : 'Download bootstrap.zip'}
          </button>
        </div>

        {fingerprint && (
          <>
            <div className="p-4 bg-[#1a1d22] rounded-[14px] border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-[#e2e6ee]">Package Fingerprint</h3>
                <button
                  onClick={copyFingerprint}
                  className="text-xs px-3 py-1 bg-[#1a1d22] text-white/60 hover:text-white border border-white/10 rounded-[14px] hover:bg-[#111317] transition-colors flex items-center gap-1"
                >
                  {fingerprintCopied ? (
                    <>
                      <Check className="w-3 h-3 text-[#10b981]" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <code className="text-xs font-mono text-white/80 break-all">
                {fingerprint}
              </code>
            </div>

            {/* QR Code for Mobile Verification (Phase 9) */}
            <div className="p-4 bg-[#1a1d22] rounded-[14px] border border-white/10">
              <h3 className="text-sm font-semibold mb-3 text-[#e2e6ee]">Mobile Verification</h3>
              <p className="text-xs text-white/60 mb-4">
                Scan this QR code with your mobile device to verify and activate the bootstrap kit:
              </p>
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG
                  value={getQRUrl()}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs text-white/40 mt-3 text-center">
                {getQRUrl()}
              </p>
            </div>
          </>
        )}

        {verifyCommand && (
          <div className="p-4 bg-[#1a1d22] rounded-[14px] border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[#e2e6ee]">Verify Command</h3>
              <button
                onClick={copyVerifyCommand}
                className="text-xs px-3 py-1 bg-[#1a1d22] text-white/60 hover:text-white border border-white/10 rounded-[14px] hover:bg-[#111317] transition-colors"
              >
                Copy
              </button>
            </div>
            <code className="text-xs font-mono text-white/80 block break-all">
              {verifyCommand}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}

