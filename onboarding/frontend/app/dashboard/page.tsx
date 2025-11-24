'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OCTGuard } from '@/components/OCTGuard';
import { CheckCircle2, Clock, Building2, MapPin, Calendar, UserPlus, Download, Bot, KeyRound, ScrollText } from 'lucide-react';
import { BootstrapStatusCard } from '@/components/BootstrapStatusCard';
import { useFakeTelemetry } from '@/lib/useFakeTelemetry';

export default function DashboardPage() {
  // Loading states
  const [isGeneratingKit, setIsGeneratingKit] = useState(false);
  const [isViewingPlans, setIsViewingPlans] = useState(false);
  const [activityVisible, setActivityVisible] = useState<boolean[]>([]);
  
  // Live telemetry
  const telemetry = useFakeTelemetry();

  // Mock data
  const tenantName = 'Acme Industries';
  const region = 'US-West';
  const onboardingDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const activityItems = [
    { action: 'Tenant created', timestamp: `${onboardingDate} at ${currentTime}` },
    { action: 'Bootstrap kit generated', timestamp: `${onboardingDate} at ${currentTime}` },
    { action: 'Operator verified identity', timestamp: `${onboardingDate} at ${currentTime}` },
  ];

  // Stagger activity feed items on mount
  useEffect(() => {
    // Initialize with correct length
    const itemCount = activityItems.length;
    setActivityVisible(new Array(itemCount).fill(false));
    
    // Stagger visibility
    activityItems.forEach((_, index) => {
      setTimeout(() => {
        setActivityVisible((prev) => {
          const newState = [...prev];
          newState[index] = true;
          return newState;
        });
      }, index * 100);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateKit = () => {
    setIsGeneratingKit(true);
    setTimeout(() => {
      setIsGeneratingKit(false);
    }, 800);
  };

  const handleViewPlans = () => {
    setIsViewingPlans(true);
    setTimeout(() => {
      setIsViewingPlans(false);
    }, 800);
  };

  return (
    <OCTGuard>
      <div className="min-h-screen bg-[#0b0c0f] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          {/* Header Bar */}
          <div className="border-b border-white/5 pb-4">
            <h1 className="text-3xl font-semibold tracking-tight text-[#e2e6ee]">
              SAGE Onboarding Dashboard
            </h1>
            <p className="text-sm text-white/60 mt-2">
              Tenant successfully initialized
            </p>
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
                    <p className="text-sm font-medium text-[#e2e6ee]">Example Tenant</p>
                  </div>
                  <div>
                    <span className="text-sm text-white/60">Region:</span>
                    <p className="text-sm font-medium text-[#e2e6ee]">US-West</p>
                  </div>
                  <div>
                    <span className="text-sm text-white/60">Status:</span>
                    <Badge variant="secondary" className="ml-2">Provisioned</Badge>
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

            {/* Status Indicators Row */}
            <div className="slide-up grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ animationDelay: "0.2s" }}>
              <Card className="hover:border-white/20 hover:shadow-[0_0_28px_-14px_rgba(0,0,0,0.9)] focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60 flex items-center gap-2">
                      <span className="block w-2 h-2 rounded-full bg-[#10b981]"></span>
                      Agents Online
                    </span>
                    <Bot className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <Badge variant="default" className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30">
                    {telemetry.agentsOnline}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="hover:border-white/20 hover:shadow-[0_0_28px_-14px_rgba(0,0,0,0.9)] focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60 flex items-center gap-2">
                      <span className="block w-2 h-2 rounded-full bg-[#10b981]"></span>
                      Signal Strength
                    </span>
                    <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <Badge variant="default" className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30">
                    {telemetry.signal}%
                  </Badge>
                </CardContent>
              </Card>

              <Card className="hover:border-white/20 hover:shadow-[0_0_28px_-14px_rgba(0,0,0,0.9)] focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60 flex items-center gap-2">
                      <span className="block w-2 h-2 rounded-full bg-neutral-500"></span>
                      Next Rotation
                    </span>
                    <Clock className="w-5 h-5 text-white/40" />
                  </div>
                  <Badge variant="secondary">{telemetry.rotationETA}s</Badge>
                </CardContent>
              </Card>
            </div>
            
            {/* System Status Card */}
            <div className="slide-up" style={{ animationDelay: "0.25s" }}>
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="capitalize">
                    {telemetry.status}
                  </Badge>
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
                      variant="secondary"
                      className="w-full justify-start"
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      Create First Agent
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full justify-start"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Additional Operator
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full justify-start"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Bootstrap Kit
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
                      disabled={false}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Bootstrap
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

            {/* Activity Feed Placeholder */}
            <div className="slide-up" style={{ animationDelay: "0.4s" }}>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {activityItems.map((item, index) => (
                      <li
                        key={index}
                        className={`border-l border-white/10 pl-4 ${
                          activityVisible[index] ? 'animate-in fade-in duration-200' : 'opacity-0'
                        }`}
                      >
                        <span className="text-sm text-neutral-300 block">{item.action}</span>
                        <span className="text-xs text-neutral-500 block mt-1">{item.timestamp}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </OCTGuard>
  );
}
