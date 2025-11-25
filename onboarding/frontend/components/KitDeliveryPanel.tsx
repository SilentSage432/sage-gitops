'use client';

import { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export function KitDeliveryPanel() {
  const [downloading, setDownloading] = useState(false);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [verifyCommand, setVerifyCommand] = useState<string>('');

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

      const token = localStorage.getItem('oct-storage');
      if (!token) {
        throw new Error('No access token available');
      }

      const octData = JSON.parse(token);
      const response = await axios.post(
        `${API_BASE_URL}/api/onboarding/bootstrap/kit`,
        {},
        {
          headers: {
            Authorization: `Bearer ${octData.token}`,
          },
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bootstrap.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Fetch fingerprint and verify command
      const metaResponse = await axios.get(`${API_BASE_URL}/api/onboarding/bootstrap/meta`, {
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
    } catch (error: any) {
      console.error('Download error:', error);
      alert('Failed to download bootstrap kit: ' + (error.message || 'Unknown error'));
    } finally {
      setDownloading(false);
    }
  };

  const copyVerifyCommand = () => {
    navigator.clipboard.writeText(verifyCommand);
    alert('Verify command copied to clipboard');
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
          <div className="p-4 bg-[#1a1d22] rounded-[14px] border border-white/10">
            <h3 className="text-sm font-semibold mb-2 text-[#e2e6ee]">Package Fingerprint</h3>
            <code className="text-xs font-mono text-white/80 break-all">
              {fingerprint}
            </code>
          </div>
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

