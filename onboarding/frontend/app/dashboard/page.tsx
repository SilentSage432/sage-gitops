'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OCTGuard } from '@/components/OCTGuard';
import { CheckCircle2, Clock, Building2, MapPin, Calendar, UserPlus, Download, Bot, KeyRound, ScrollText } from 'lucide-react';
import { BootstrapStatusCard } from '@/components/BootstrapStatusCard';

export default function DashboardPage() {
  // Loading states
  const [isGeneratingKit, setIsGeneratingKit] = useState(false);
  const [isViewingPlans, setIsViewingPlans] = useState(false);
  const [activityVisible, setActivityVisible] = useState<boolean[]>([]);

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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-[#0b0c0f] text-white animate-in fade-in duration-300 ease-out"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header Bar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 border-b border-white/5 pb-4"
          >
            <h1 className="text-2xl font-semibold tracking-tight mb-2 text-[#e2e6ee]">
              SAGE Onboarding Dashboard
            </h1>
            <p className="text-sm text-neutral-400">
              Tenant successfully initialized
            </p>
          </motion.div>

          <div className="space-y-6">
            {/* Bootstrap Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <BootstrapStatusCard />
            </motion.div>

            {/* Tenant Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-white/10 bg-[#111317]">
                <CardHeader>
                  <CardTitle>Tenant Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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
            </motion.div>

            {/* Onboarding Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <Card className="border-white/10 bg-[#111317]">
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
            </motion.div>

            {/* Status Indicators Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <Card className="border-white/10 bg-[#111317] hover:border-violet-400/30 hover:scale-[1.01] transition-transform focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60 flex items-center gap-2">
                      <span className="block w-2 h-2 rounded-full bg-[#10b981]"></span>
                      Bootstrap Status
                    </span>
                    <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <Badge variant="default" className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30">
                    ✅ Ready
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-[#111317] hover:border-violet-400/30 hover:scale-[1.01] transition-transform focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60 flex items-center gap-2">
                      <span className="block w-2 h-2 rounded-full bg-[#10b981]"></span>
                      OCT Status
                    </span>
                    <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <Badge variant="default" className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30">
                    ✅ Active
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-[#111317] hover:border-violet-400/30 hover:scale-[1.01] transition-transform focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60 flex items-center gap-2">
                      <span className="block w-2 h-2 rounded-full bg-neutral-500"></span>
                      Next Rotation
                    </span>
                    <Clock className="w-5 h-5 text-white/40" />
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </CardContent>
              </Card>
            </motion.div>

            {/* Next Steps Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-white/10 bg-[#111317]">
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
            </motion.div>

            {/* Quick Tools */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <Card className="border-white/10 bg-[#111317]">
                <CardHeader>
                  <CardTitle>Quick Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
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
            </motion.div>

            {/* Activity Feed Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="border-white/10 bg-[#111317]">
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
            </motion.div>
          </div>
        </div>
      </motion.div>
    </OCTGuard>
  );
}
