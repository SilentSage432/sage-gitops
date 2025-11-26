import { useState, useEffect } from 'react';
import { getTenantId } from './onboarding/getTenantId';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface TenantAgent {
  id: string;
  status: 'pending' | 'deployed' | 'failed';
}

export interface TenantAgentsResponse {
  agents: TenantAgent[];
}

export function useTenantAgents(tenantId?: string | null) {
  const [data, setData] = useState<TenantAgentsResponse | null>(null);
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

    const fetchAgents = async () => {
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
          `${API_BASE_URL}/api/onboarding/tenants/${resolvedTenantId}/agents`,
          { headers }
        );

        if (!isMounted) return;

        if (!res.ok) {
          throw new Error(`Failed to fetch agents: ${res.statusText}`);
        }

        const agentsData = await res.json();
        setData(agentsData);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load agents');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAgents();

    // Poll every 30 seconds
    const interval = setInterval(fetchAgents, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [resolvedTenantId]);

  return { data, isLoading, error };
}

