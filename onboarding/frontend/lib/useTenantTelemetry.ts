import { useState, useEffect } from 'react';
import { getTenantId } from './onboarding/getTenantId';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface TenantTelemetry {
  agentCount: number;
  lastSignal: string;
  rotationEta: string;
  healthScore: number;
  alerts: Array<{
    severity: string;
    message: string;
    timestamp: string;
  }>;
  signals: Array<{
    type: string;
    timestamp: string;
    value: string;
  }>;
}

export function useTenantTelemetry(tenantId?: string | null) {
  const [data, setData] = useState<TenantTelemetry | null>(null);
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

    const fetchTelemetry = async () => {
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
          `${API_BASE_URL}/api/onboarding/tenants/${resolvedTenantId}/telemetry`,
          { headers }
        );

        if (!isMounted) return;

        if (!res.ok) {
          throw new Error(`Failed to fetch telemetry: ${res.statusText}`);
        }

        const telemetryData = await res.json();
        setData(telemetryData);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load telemetry');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTelemetry();

    // Poll every 30 seconds
    const interval = setInterval(fetchTelemetry, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [resolvedTenantId]);

  return { data, isLoading, error };
}

