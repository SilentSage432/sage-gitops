// TypeScript types for onboarding API responses

export interface TenantTelemetryResponse {
  tenantId: string;
  companyName: string;
  agentCount: number;
  selectedAgents: Array<{
    id: string;
    name: string;
  }>;
  bootstrapStatus: "pending" | "issued" | "expired" | "activated";
  signalStrength: number;
  rotationETA: string;
}

export interface TenantStatusResponse {
  tenantId: string;
  activation: {
    createdAt: string;
    bootstrapGenerated: boolean;
    bootstrapFingerprint: string | null;
    bootstrapActivated: boolean;
    bootstrapExpired: boolean;
  };
  agents: {
    count: number;
    deployed: number;
    pending: number;
    failed: number;
    details: Array<{
      id: string;
      name: string;
      status: "deployed" | "pending" | "failed";
    }>;
  };
  federation: {
    ready: boolean;
    lastSeen: string | null;
    nodeConnected: boolean;
  };
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: string;
  summary: string;
  detail: string;
  severity: "info" | "success" | "warning" | "error";
}

export interface TenantActivityResponse {
  tenantId: string;
  events: ActivityEvent[];
}

export interface TenantDashboardData {
  telemetry: TenantTelemetryResponse | null;
  status: TenantStatusResponse | null;
  activity: TenantActivityResponse | null;
  isLoading: boolean;
  error: string | null;
}

