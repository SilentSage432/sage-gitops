'use client';

import { useEffect, useState } from 'react';
import { getOCT, isOCTValid } from '@/lib/api/oct';

export function InitiatorBadge() {
  const [oct, setOCT] = useState<{ scopes: string[]; expiresAt: number } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const octData = getOCT();
    if (octData && isOCTValid()) {
      setOCT({ scopes: octData.scopes, expiresAt: octData.expiresAt });
    }

    const interval = setInterval(() => {
      const currentOCT = getOCT();
      if (currentOCT && isOCTValid()) {
        const remaining = Math.max(0, currentOCT.expiresAt - Date.now());
        setTimeRemaining(Math.floor(remaining / 1000));
        setOCT({ scopes: currentOCT.scopes, expiresAt: currentOCT.expiresAt });
      } else {
        setTimeRemaining(0);
        setOCT(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!oct) return null;

  return (
    <div className="bg-[#111317] border border-white/10 p-4 mb-6 rounded-[14px]">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold mb-1 text-[#e2e6ee]">Operator Capability Token (OCT)</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {oct.scopes.map((scope, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-[#1a1d22] text-[#6366f1] text-xs rounded-full border border-white/10"
              >
                {scope}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/60 mb-1">Time Remaining</div>
          <div className="text-lg font-mono font-semibold text-[#6366f1]">
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>
    </div>
  );
}

