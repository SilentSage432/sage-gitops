'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OCTGuard } from '@/components/OCTGuard';
import { CheckCircle2, Clock, UserPlus, Bot, KeyRound, ScrollText, RefreshCw, AlertCircle } from 'lucide-react';
import { BootstrapStatusCard } from '@/components/BootstrapStatusCard';
import { BootstrapAuditFeed } from '@/components/BootstrapAuditFeed';
import { useTenantDashboard } from '@/lib/useTenantDashboard';

export default function DashboardPage() {
  // Get tenantId from localStorage (set during onboarding)
  const [tenantId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastTenantId');
    }
    return null;
  });

  // Real dashboard data
  const dashboardData = useTenantDashboard(tenantId);
  
  // Derived data for backward compatibility with existing UI
  const telemetry = dashboardData.telemetry ? {
    agentsOnline: dashboardData.telemetry.agentCount,
    signal: dashboardData.telemetry.signalStrength,
    rotationETA: dashboardData.telemetry.rotationETA.replace(/[^0-9]/g, '') || '0',
    status: dashboardData.telemetry.bootstrapStatus === 'activated' ? 'optimizing' : 'stabilizing',
  } : {
    agentsOnline: 0,
    signal: 0,
    rotationETA: '0',
    status: 'stabilizing',
  };

  // Map status data to tiles format (Phase 7 enhanced)
  const tiles = dashboardData.status ? [
    { 
      label: "Mesh Link", 
      state: dashboardData.status.federation.ready && dashboardData.status.federation.nodeConnected ? "ok" : dashboardData.status.federation.nodeConnected ? "warning" : "error" as const 
    },
    { 
      label: "Rho² Vault", 
      state: dashboardData.status.activation.bootstrapActivated ? "ok" : dashboardData.status.activation.bootstrapExpired ? "warning" : dashboardData.status.activation.bootstrapGenerated ? "warning" : "ok" as const 
    },
    { 
      label: "Policy Engine", 
      state: dashboardData.status.agents.failed === 0 ? "ok" : "warning" as const 
    },
    { 
      label: "Signal Horizon", 
      state: dashboardData.status.federation.ready ? "ok" : "warning" as const 
    },
    { 
      label: "Audit Channel", 
      state: "ok" as const 
    },
    { 
      label: "Bootstrap CA", 
      state: dashboardData.status.activation.bootstrapActivated ? "ok" : dashboardData.status.activation.bootstrapExpired ? "warning" : dashboardData.status.activation.bootstrapGenerated ? "warning" : "ok" as const 
    },
  ] : [
    { label: "Mesh Link", state: "ok" as const },
    { label: "Rho² Vault", state: "ok" as const },
    { label: "Policy Engine", state: "ok" as const },
    { label: "Signal Horizon", state: "ok" as const },
    { label: "Audit Channel", state: "ok" as const },
    { label: "Bootstrap CA", state: "ok" as const },
  ];

  // Map activity events to activity stream format
  const activity = dashboardData.activity?.events.map((event) => {
    const icon = event.severity === "success" ? "✓" : event.severity === "warning" ? "⚠" : event.severity === "error" ? "✗" : "›";
    return `${icon} ${event.summary}`;
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
                  {dashboardData.status?.companyName || "Tenant Dashboard"}
                </p>
              </div>
              {dashboardData.isLoading && (
                <RefreshCw className="w-5 h-5 text-white/40 animate-spin" />
              )}
            </div>
            {dashboardData.error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-500">{dashboardData.error}</p>
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
                    <span className="text-sm text-white/60">Tenant Name:</span>
                    <p className="text-sm font-medium text-[#e2e6ee]">
                      {dashboardData.telemetry?.companyName || "Loading..."}
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
                        dashboardData.status?.activation.bootstrapActivated ? "bg-green-500/20 text-green-500" :
                        dashboardData.status?.activation.bootstrapExpired ? "bg-yellow-500/20 text-yellow-500" :
                        dashboardData.status?.activation.bootstrapGenerated ? "bg-blue-500/20 text-blue-500" :
                        "bg-gray-500/20 text-gray-500"
                      }`}
                    >
                      {dashboardData.status?.activation.bootstrapActivated ? "Activated" :
                       dashboardData.status?.activation.bootstrapExpired ? "Expired" :
                       dashboardData.status?.activation.bootstrapGenerated ? "Generated" :
                       "Pending"}
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

            {/* Status Indicators Row - Phase 7 Enhanced */}
            <div className="slide-up grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ animationDelay: "0.2s" }}>
              <Card className="hover:border-white/20 hover:shadow-[0_0_28px_-14px_rgba(0,0,0,0.9)] focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60 flex items-center gap-2">
                      <span className={`block w-2 h-2 rounded-full ${
                        dashboardData.status?.agents.deployed > 0 ? "bg-[#10b981]" : 
                        dashboardData.status?.agents.pending > 0 ? "bg-yellow-500" : 
                        "bg-neutral-500"
                      }`}></span>
                      Agents Deployed
                    </span>
                    <Bot className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <div className="space-y-1">
                    <Badge variant="default" className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30">
                      {dashboardData.status?.agents.deployed || 0} / {dashboardData.status?.agents.count || 0}
                    </Badge>
                    {dashboardData.status && dashboardData.status.agents.failed > 0 && (
                      <p className="text-xs text-red-400">{dashboardData.status.agents.failed} failed</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:border-white/20 hover:shadow-[0_0_28px_-14px_rgba(0,0,0,0.9)] focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60 flex items-center gap-2">
                      <span className={`block w-2 h-2 rounded-full ${
                        dashboardData.status?.activation.bootstrapActivated ? "bg-[#10b981]" :
                        dashboardData.status?.activation.bootstrapGenerated ? "bg-blue-500" :
                        "bg-neutral-500"
                      }`}></span>
                      Bootstrap Status
                    </span>
                    <CheckCircle2 className={`w-5 h-5 ${
                          dashboardData.status?.activation.bootstrapActivated ? "text-[#10b981]" :
                          dashboardData.status?.activation.bootstrapGenerated ? "text-blue-500" :
                          "text-white/40"
                        }`} />
                  </div>
                  <Badge variant="default" className={
                    dashboardData.status?.activation.bootstrapActivated ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30" :
                    dashboardData.status?.activation.bootstrapGenerated ? "bg-blue-500/20 text-blue-500 border-blue-500/30" :
                    "bg-neutral-500/20 text-neutral-500 border-neutral-500/30"
                  }>
                    {dashboardData.status?.activation.bootstrapActivated ? "Activated" :
                     dashboardData.status?.activation.bootstrapExpired ? "Expired" :
                     dashboardData.status?.activation.bootstrapGenerated ? "Generated" :
                     "Pending"}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="hover:border-white/20 hover:shadow-[0_0_28px_-14px_rgba(0,0,0,0.9)] focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60 flex items-center gap-2">
                      <span className={`block w-2 h-2 rounded-full ${
                        dashboardData.status?.federation.ready && dashboardData.status?.federation.nodeConnected ? "bg-[#10b981]" :
                        dashboardData.status?.federation.nodeConnected ? "bg-yellow-500" :
                        "bg-neutral-500"
                      }`}></span>
                      Federation
                    </span>
                    <Clock className={`w-5 h-5 ${
                      dashboardData.status?.federation.ready ? "text-[#10b981]" : "text-white/40"
                    }`} />
                  </div>
                  <Badge variant="secondary">
                    {dashboardData.status?.federation.ready ? "Ready" :
                     dashboardData.status?.federation.nodeConnected ? "Connected" :
                     "Not Connected"}
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

            {/* Agent Summary - Phase 7 */}
            {dashboardData.status && dashboardData.status.agents.count > 0 && (
              <div className="slide-up" style={{ animationDelay: "0.26s" }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Agent Deployment Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">Total Agents</span>
                        <span className="text-sm font-medium text-[#e2e6ee]">{dashboardData.status.agents.count}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">Deployed</span>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          {dashboardData.status.agents.deployed}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">Pending</span>
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          {dashboardData.status.agents.pending}
                        </Badge>
                      </div>
                      {dashboardData.status.agents.failed > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/60">Failed</span>
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            {dashboardData.status.agents.failed}
                          </Badge>
                        </div>
                      )}
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-xs text-white/60 mb-2">Agent Details:</p>
                        <div className="space-y-2">
                          {dashboardData.status.agents.details.map((agent) => (
                            <div key={agent.id} className="flex items-center justify-between text-sm">
                              <span className="text-white/80">{agent.name}</span>
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

            {/* Federation Summary - Phase 7 */}
            <div className="slide-up" style={{ animationDelay: "0.27s" }}>
              <Card>
                <CardHeader>
                  <CardTitle>Federation Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">Ready</span>
                      <Badge className={
                        dashboardData.status?.federation.ready 
                          ? "bg-green-500/20 text-green-400 border-green-500/30" 
                          : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }>
                        {dashboardData.status?.federation.ready ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">Node Connected</span>
                      <Badge className={
                        dashboardData.status?.federation.nodeConnected 
                          ? "bg-green-500/20 text-green-400 border-green-500/30" 
                          : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }>
                        {dashboardData.status?.federation.nodeConnected ? "Connected" : "Not Connected"}
                      </Badge>
                    </div>
                    {dashboardData.status?.federation.lastSeen && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">Last Seen</span>
                        <span className="text-xs font-mono text-white/60">
                          {new Date(dashboardData.status.federation.lastSeen).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
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
