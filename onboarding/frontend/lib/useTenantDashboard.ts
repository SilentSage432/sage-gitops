import { useState, useEffect } from "react";
import type {
  TenantDashboardData,
  TenantTelemetryResponse,
  TenantStatusResponse,
  TenantActivityResponse,
} from "./api/onboarding-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function useTenantDashboard(tenantId: string | null) {
  const [data, setData] = useState<TenantDashboardData>({
    telemetry: null,
    status: null,
    activity: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!tenantId) {
      setData({
        telemetry: null,
        status: null,
        activity: null,
        isLoading: false,
        error: "No tenant ID provided",
      });
      return;
    }

    let isMounted = true;

    const fetchDashboardData = async () => {
      setData((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Get OCT token from localStorage
        const octStorage = localStorage.getItem("oct-storage");
        const octToken = octStorage ? JSON.parse(octStorage).token : "";

        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (octToken) {
          headers["Authorization"] = `Bearer ${octToken}`;
        }

        // Fetch all three endpoints in parallel
        const [telemetryRes, statusRes, activityRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/onboarding/tenants/${tenantId}/telemetry`, {
            headers,
          }),
          fetch(`${API_BASE_URL}/api/onboarding/tenants/${tenantId}/status`, {
            headers,
          }),
          fetch(`${API_BASE_URL}/api/onboarding/tenants/${tenantId}/activity`, {
            headers,
          }),
        ]);

        if (!isMounted) return;

        // Handle telemetry response
        let telemetry: TenantTelemetryResponse | null = null;
        if (telemetryRes.ok) {
          telemetry = await telemetryRes.json();
        } else if (telemetryRes.status !== 404) {
          throw new Error(`Failed to fetch telemetry: ${telemetryRes.statusText}`);
        }

        // Handle status response
        let status: TenantStatusResponse | null = null;
        if (statusRes.ok) {
          status = await statusRes.json();
        } else if (statusRes.status !== 404) {
          throw new Error(`Failed to fetch status: ${statusRes.statusText}`);
        }

        // Handle activity response
        let activity: TenantActivityResponse | null = null;
        if (activityRes.ok) {
          activity = await activityRes.json();
        } else if (activityRes.status !== 404) {
          throw new Error(`Failed to fetch activity: ${activityRes.statusText}`);
        }

        setData({
          telemetry,
          status,
          activity,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        if (!isMounted) return;
        setData({
          telemetry: null,
          status: null,
          activity: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to load dashboard data",
        });
      }
    };

    fetchDashboardData();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [tenantId]);

  return data;
}

