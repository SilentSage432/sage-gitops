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
      const token = localStorage.getItem('oct-storage');
      if (!token) {
        throw new Error('No access token available');
      }

      const octData = JSON.parse(token);
      const response = await axios.post(
        `${API_BASE_URL}/bootstrap/kit`,
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
      const metaResponse = await axios.get(`${API_BASE_URL}/bootstrap/meta`, {
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
    <div className="glass p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Bootstrap Kit Delivery</h2>
      
      <div className="space-y-6">
        <div>
          <button
            onClick={handleDownloadKit}
            disabled={downloading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {downloading ? 'Downloading...' : 'Download bootstrap.zip'}
          </button>
        </div>

        {fingerprint && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold mb-2">Package Fingerprint</h3>
            <code className="text-xs font-mono text-gray-800 break-all">
              {fingerprint}
            </code>
          </div>
        )}

        {verifyCommand && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Verify Command</h3>
              <button
                onClick={copyVerifyCommand}
                className="text-xs px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Copy
              </button>
            </div>
            <code className="text-xs font-mono text-gray-800 block break-all">
              {verifyCommand}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}

