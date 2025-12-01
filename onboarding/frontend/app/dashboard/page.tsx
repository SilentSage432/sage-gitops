'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, UserPlus, Bot, KeyRound, ScrollText, RefreshCw, AlertCircle } from 'lucide-react';
import { BootstrapStatusCard } from '@/components/BootstrapStatusCard';
import { BootstrapAuditFeed } from '@/components/BootstrapAuditFeed';
import { useTenantTelemetry } from '@/lib/useTenantTelemetry';
import { useTenantStatus } from '@/lib/useTenantStatus';
import { useTenantAgents } from '@/lib/useTenantAgents';
import { useTenantActivity } from '@/lib/useTenantActivity';
import { useBootstrapStatus } from '@/lib/useBootstrapStatus';
import { getTenantId } from '@/lib/onboarding/getTenantId';

export default function DashboardPage() {
  // Get tenantId using helper
  const tenantId = getTenantId();

  // Phase 8: Real-time data hooks
  const telemetry = useTenantTelemetry(tenantId);
  const status = useTenantStatus(tenantId);
  const agents = useTenantAgents(tenantId);
  const activity = useTenantActivity(tenantId);
  // Phase 9: Bootstrap status
  const bootstrapStatus = useBootstrapStatus(tenantId);
  
  // Map status data to tiles format (Phase 9 - using bootstrapStatus)
  const tiles = status.data ? [
    { 
      label: "Mesh Link", 
      state: status.data.clusterHealth === "nominal" ? "ok" : status.data.clusterHealth === "degraded" ? "warning" : "error"
    },
    { 
      label: "Rho² Vault", 
      state: bootstrapStatus.data?.activated ? "ok" : bootstrapStatus.data?.fingerprint ? "warning" : "ok"
    },
    { 
      label: "Policy Engine", 
      state: status.data.clusterHealth === "nominal" ? "ok" : "warning"
    },
    { 
      label: "Signal Horizon", 
      state: status.data.regionsReady ? "ok" : "warning"
    },
    { 
      label: "Audit Channel", 
      state: "ok"
    },
    { 
      label: "Bootstrap CA", 
      state: bootstrapStatus.data?.activated ? "ok" : bootstrapStatus.data?.fingerprint ? "warning" : "ok"
    },
  ] : [
    { label: "Mesh Link", state: "ok" },
    { label: "Rho² Vault", state: "ok" },
    { label: "Policy Engine", state: "ok" },
    { label: "Signal Horizon", state: "ok" },
    { label: "Audit Channel", state: "ok" },
    { label: "Bootstrap CA", state: "ok" },
  ];

  // Format activity events for display
  const activityEvents = activity.data?.events.map((event) => {
    const typeMap = {
      'tenant.created': 'Tenant registered',
      'kit.generated': 'Bootstrap kit generated',
      'kit.verified': 'Bootstrap kit verified',
      'agent.created': 'Agent created',
    };
    const icon = event.type.includes('verified') ? "✓" : event.type.includes('created') ? "›" : "⚠";
    return `${icon} ${typeMap[event.type] || event.type}`;
  }) || [];

  return (
    <div className="min-h-screen bg-[#0b0c0f] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="border-b border-white/5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-[#e2e6ee]">
                SAGE Onboarding Dashboard
              </h1>
              <p className="text-sm text-white/60 mt-2">
                Tenant Dashboard
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
