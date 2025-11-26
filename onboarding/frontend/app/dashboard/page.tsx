'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OCTGuard } from '@/components/OCTGuard';
import { CheckCircle2, Clock, UserPlus, Bot, KeyRound, ScrollText, RefreshCw, AlertCircle } from 'lucide-react';
import { BootstrapStatusCard } from '@/components/BootstrapStatusCard';
import { BootstrapAuditFeed } from '@/components/BootstrapAuditFeed';
import { useTenantTelemetry } from '@/lib/useTenantTelemetry';
import { useTenantStatus } from '@/lib/useTenantStatus';
import { useTenantAgents } from '@/lib/useTenantAgents';
import { useTenantActivity } from '@/lib/useTenantActivity';
import { getTenantId } from '@/lib/onboarding/getTenantId';

export default function DashboardPage() {
  // Get tenantId using helper
  const tenantId = getTenantId();

  // Phase 8: Real-time data hooks
  const telemetry = useTenantTelemetry(tenantId);
  const status = useTenantStatus(tenantId);
  const agents = useTenantAgents(tenantId);
  const activity = useTenantActivity(tenantId);
  // Map status data to tiles format (Phase 8)
  const tiles = status.data ? [
    { 
      label: "Mesh Link", 
      state: status.data.clusterHealth === "nominal" ? "ok" : status.data.clusterHealth === "degraded" ? "warning" : "error" as const 
    },
    { 
      label: "Rho² Vault", 
      state: status.data.bootstrap.verified ? "ok" : status.data.bootstrap.generated ? "warning" : "ok" as const 
    },
    { 
      label: "Policy Engine", 
      state: status.data.clusterHealth === "nominal" ? "ok" : "warning" as const 
    },
    { 
      label: "Signal Horizon", 
      state: status.data.regionsReady ? "ok" : "warning" as const 
    },
    { 
      label: "Audit Channel", 
      state: "ok" as const 
    },
    { 
      label: "Bootstrap CA", 
      state: status.data.bootstrap.verified ? "ok" : status.data.bootstrap.generated ? "warning" : "ok" as const 
    },
  ] : [
    { label: "Mesh Link", state: "ok" as const },
    { label: "Rho² Vault", state: "ok" as const },
    { label: "Policy Engine", state: "ok" as const },
    { label: "Signal Horizon", state: "ok" as const },
    { label: "Audit Channel", state: "ok" as const },
    { label: "Bootstrap CA", state: "ok" as const },
  ];

  // Format activity events for display
  const activityEvents = activity.data?.events.map((event) => {
    const typeMap: Record<string, string> = {
      'tenant.created': 'Tenant registered',
      'kit.generated': 'Bootstrap kit generated',
      'kit.verified': 'Bootstrap kit verified',
      'agent.created': 'Agent created',
    };
    const icon = event.type.includes('verified') ? "✓" : event.type.includes('created') ? "›" : "⚠";
    return `${icon} ${typeMap[event.type] || event.type}`;
  }) || [];

  return (
    <OCTGuard>
      <div className="min-h-screen bg-[#0b0c0f] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          {/* Header Bar */}
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
              {(telemetry.isLoading || status.isLoading || agents.isLoading || activity.isLoading) && (
                <RefreshCw className="w-5 h-5 text-white/40 animate-spin" />
              )}
            </div>
            {(telemetry.error || status.error || agents.error || activity.error) && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-500">
                  {telemetry.error || status.error || agents.error || activity.error}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="ml-auto"
                >
                  Retry
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Bootstrap Status Card */}
            <div className="slide-up" style={{ animationDelay: "0.05s" }}>
              <BootstrapStatusCard />
            </div>

            {/* Tenant Summary Card */}
            <div className="slide-up" style={{ animationDelay: "0.1s" }}>
              <Card>
                <CardHeader>
                  <CardTitle>Tenant Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm text-white/60">Tenant ID:</span>
                    <p className="text-sm font-mono text-[#e2e6ee]">
                      {tenantId ? tenantId.substring(0, 8) + "..." : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-white/60">Tenant ID:</span>
                    <p className="text-sm font-mono text-[#e2e6ee]">
                      {tenantId ? tenantId.substring(0, 8) + "..." : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-white/60">Activation Status:</span>
                    <Badge 
                      variant="secondary" 
                      className={`ml-2 ${
                        status.data?.bootstrap.verified ? "bg-green-500/20 text-green-500" :
                        status.data?.bootstrap.generated ? "bg-blue-500/20 text-blue-500" :
                        "bg-gray-500/20 text-gray-500"
                      }`}
                    >
                      {status.data?.bootstrap.verified ? "Activated" :
                       status.data?.bootstrap.generated ? "Generated" :
                       "Pending"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-white/60">Cluster Health:</span>
                    <Badge 
                      variant="secondary" 
                      className={`ml-2 ${
                        status.data?.clusterHealth === "nominal" ? "bg-green-500/20 text-green-500" :
                        status.data?.clusterHealth === "degraded" ? "bg-yellow-500/20 text-yellow-500" :
                        status.data?.clusterHealth === "critical" ? "bg-red-500/20 text-red-500" :
                        "bg-gray-500/20 text-gray-500"
                      }`}
                    >
                      {status.data?.clusterHealth || "Unknown"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Onboarding Status Card */}
            <div className="slide-up" style={{ animationDelay: "0.15s" }}>
              <Card>
                <CardHeader>
                  <CardTitle>Onboarding Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-white/80">Bootstrap delivered</p>
                    <p className="text-sm text-white/60">Next step: Create first agent</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/60">Progress</span>
                      <span className="text-xs text-white/60">100%</span>
                    </div>
                    <div className="w-full h-2 bg-[#1a1d22] rounded-full overflow-hidden">
                      <div className="h-full bg-[#10b981] w-full transition-all" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Indicators Row - Phase 8 */}
            <div className="slide-up grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ animationDelay: "0.2s" }}>
              <Card className="hover:border-white/20 hover:shadow-[0_0_28px_-14px_rgba(0,0,0,0.9)] focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60 flex items-center gap-2">
                      <span className={`block w-2 h-2 rounded-full ${
                        telemetry.data?.agentCount > 0 ? "bg-[#10b981]" : "bg-neutral-500"
                      }`}></span>
                      Agents Online
                    </span>
                    <Bot className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <Badge variant="default" className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30">
                    {telemetry.data?.agentCount || 0}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="hover:border-white/20 hover:shadow-[0_0_28px_-14px_rgba(0,0,0,0.9)] focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60 flex items-center gap-2">
                      <span className={`block w-2 h-2 rounded-full ${
                        (telemetry.data?.healthScore || 0) >= 90 ? "bg-[#10b981]" :
                        (telemetry.data?.healthScore || 0) >= 70 ? "bg-yellow-500" :
                        "bg-red-500"
                      }`}></span>
                      Health Score
                    </span>
                    <CheckCircle2 className={`w-5 h-5 ${
                      (telemetry.data?.healthScore || 0) >= 90 ? "text-[#10b981]" :
                      (telemetry.data?.healthScore || 0) >= 70 ? "text-yellow-500" :
                      "text-red-500"
                    }`} />
                  </div>
                  <Badge variant="default" className={
                    (telemetry.data?.healthScore || 0) >= 90 ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30" :
                    (telemetry.data?.healthScore || 0) >= 70 ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" :
                    "bg-red-500/20 text-red-500 border-red-500/30"
                  }>
                    {telemetry.data?.healthScore || 0}%
                  </Badge>
                </CardContent>
              </Card>

              <Card className="hover:border-white/20 hover:shadow-[0_0_28px_-14px_rgba(0,0,0,0.9)] focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60 flex items-center gap-2">
                      <span className={`block w-2 h-2 rounded-full ${
                        status.data?.clusterHealth === "nominal" ? "bg-[#10b981]" :
                        status.data?.clusterHealth === "degraded" ? "bg-yellow-500" :
                        "bg-neutral-500"
                      }`}></span>
                      Cluster Health
                    </span>
                    <Clock className={`w-5 h-5 ${
                      status.data?.clusterHealth === "nominal" ? "text-[#10b981]" : "text-white/40"
                    }`} />
                  </div>
                  <Badge variant="secondary">
                    {status.data?.clusterHealth || "Unknown"}
                  </Badge>
                </CardContent>
              </Card>
            </div>
            
            {/* Live Status Tiles */}
            <div className="slide-up" style={{ animationDelay: "0.25s" }}>
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {tiles.map((t) => (
                      <div
                        key={t.label}
                        className={`
                          rounded-xl p-4 border backdrop-blur 
                          transition-all duration-500
                          ${
                            t.state === "ok"
                              ? "border-emerald-500/40 bg-emerald-500/10"
                              : t.state === "warning"
                              ? "border-amber-500/40 bg-amber-500/10 animate-pulse"
                              : "border-red-500/50 bg-red-500/20 shadow-[0_0_18px_rgba(255,0,0,0.45)]"
                          }
                        `}
                      >
                        <p className="text-white/90 font-medium">{t.label}</p>
                        <p className="text-xs text-white/50 mt-1">
                          {t.state === "ok" && "Stable"}
                          {t.state === "warning" && "Degraded"}
                          {t.state === "error" && "Fault"}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Agent Summary - Phase 8 */}
            {agents.data && agents.data.agents.length > 0 && (
              <div className="slide-up" style={{ animationDelay: "0.26s" }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Agent Deployment Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">Total Agents</span>
                        <span className="text-sm font-medium text-[#e2e6ee]">{agents.data.agents.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">Deployed</span>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          {agents.data.agents.filter(a => a.status === 'deployed').length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">Pending</span>
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          {agents.data.agents.filter(a => a.status === 'pending').length}
                        </Badge>
                      </div>
                      {agents.data.agents.filter(a => a.status === 'failed').length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/60">Failed</span>
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            {agents.data.agents.filter(a => a.status === 'failed').length}
                          </Badge>
                        </div>
                      )}
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-xs text-white/60 mb-2">Agent Details:</p>
                        <div className="space-y-2">
                          {agents.data.agents.map((agent) => (
                            <div key={agent.id} className="flex items-center justify-between text-sm">
                              <span className="text-white/80">{agent.id}</span>
                              <Badge className={
                                agent.status === "deployed" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                                agent.status === "failed" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              }>
                                {agent.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Activity Feed - Phase 8 */}
            <div className="slide-up" style={{ animationDelay: "0.27s" }}>
              <Card>
                <CardHeader>
                  <CardTitle>Activity Stream</CardTitle>
                </CardHeader>
                <CardContent>
                  {activity.isLoading ? (
                    <p className="text-sm text-white/60">Loading activity...</p>
                  ) : activity.error ? (
                    <p className="text-sm text-red-400">Error loading activity: {activity.error}</p>
                  ) : activityEvents.length === 0 ? (
                    <p className="text-sm text-white/60">No activity recorded yet</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {activityEvents.map((event, idx) => (
                        <div key={idx} className="text-sm text-white/80 font-mono">
                          {event}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Next Steps Panel */}
            <div className="slide-up" style={{ animationDelay: "0.3s" }}>
              <Card>
                <CardHeader>
                  <CardTitle>Next Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      Create First Agent
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Additional Operator
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Tools */}
            <div className="slide-up" style={{ animationDelay: "0.35s" }}>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Bot className="mr-2 h-4 w-4" />
                      Manage Agents
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      Operator Access
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      disabled={true}
                      title="Coming soon"
                    >
                      <ScrollText className="mr-2 h-4 w-4" />
                      View Audit Log
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Feed */}
            <div className="slide-up" style={{ animationDelay: "0.4s" }}>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData.isLoading ? (
                    <p className="text-sm text-white/60">Loading activity...</p>
                  ) : activity.length > 0 ? (
                    <ul className="space-y-1 font-mono text-sm text-white/80">
                      {activity.map((line, i) => (
                        <li key={i} className="animate-[fadeIn_300ms_ease]">
                          {line}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-white/60">No activity recorded yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bootstrap Audit Feed */}
            <div className="slide-up" style={{ animationDelay: "0.45s" }}>
              <BootstrapAuditFeed tenantId={tenantId} />
            </div>
          </div>
        </div>
      </div>
    </OCTGuard>
  );
}
