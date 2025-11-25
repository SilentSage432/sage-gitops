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
  companyName: string;
  overallHealth: "green" | "yellow" | "red";
  bootstrap: {
    status: "pending" | "issued" | "activated" | "expired";
    lastIssuedAt: string | null;
    activatedAt: string | null;
  };
  agents: {
    count: number;
    classes: string[];
  };
  federation: {
    connectedNodes: number;
    piReady: boolean;
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

