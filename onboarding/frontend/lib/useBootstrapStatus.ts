import { useState, useEffect } from 'react';
import { getTenantId } from './onboarding/getTenantId';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface BootstrapStatus {
  tenantId: string;
  fingerprint: string | null;
  activated: boolean;
  activatedAt: string | null;
  createdAt: string | null;
  expiresAt: string | null;
}

export function useBootstrapStatus(tenantId?: string | null) {
  const [data, setData] = useState<BootstrapStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolvedTenantId = tenantId || getTenantId();

  useEffect(() => {
    if (!resolvedTenantId) {
      setError('No tenant ID available');
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const octStorage = localStorage.getItem('oct-storage');
        const octToken = octStorage ? JSON.parse(octStorage).token : '';

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (octToken) {
          headers['Authorization'] = `Bearer ${octToken}`;
        }

        const res = await fetch(
          `${API_BASE_URL}/api/onboarding/bootstrap/status/${resolvedTenantId}`,
          { headers }
        );

        if (!isMounted) return;

        if (!res.ok) {
          throw new Error(`Failed to fetch bootstrap status: ${res.statusText}`);
        }

        const statusData = await res.json();
        setData(statusData);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load bootstrap status');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchStatus();

    // Auto-refresh every 10 seconds if not activated
    const interval = setInterval(() => {
      if (data && !data.activated) {
        fetchStatus();
      }
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [resolvedTenantId, data?.activated]);

  return { data, isLoading, error };
}

