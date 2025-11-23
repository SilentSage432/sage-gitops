'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OCTGuard } from '@/components/OCTGuard';
import { CheckCircle2, Clock, Building2, MapPin, Calendar } from 'lucide-react';

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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            {/* Tenant Overview Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="rounded-xl bg-neutral-900/40 border border-white/5 backdrop-blur hover:border-violet-500/30 transition-all p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#6366f1]" />
                    Tenant Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/60">Tenant Name:</span>
                    <span className="text-sm font-medium text-[#e2e6ee]">{tenantName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/60">Region:</span>
                    <span className="text-sm font-medium text-[#e2e6ee]">{region}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/60">Onboarding Date:</span>
                    <span className="text-sm font-medium text-[#e2e6ee]">{onboardingDate}</span>
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

            {/* Next Actions Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="border-white/10 bg-[#111317]">
                <CardHeader>
                  <CardTitle>Next Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button
                      className="w-full justify-start hover:bg-violet-600 active:bg-violet-700 transition-colors focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none"
                      variant="default"
                      onClick={handleGenerateKit}
                      disabled={isGeneratingKit}
                    >
                      {isGeneratingKit ? 'Generating…' : 'Generate New Bootstrap Kit'}
                    </Button>
                    <Button
                      className="w-full justify-start hover:bg-neutral-800 active:bg-neutral-900 transition-colors focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none"
                      variant="outline"
                      onClick={handleViewPlans}
                      disabled={isViewingPlans}
                    >
                      {isViewingPlans ? 'Loading…' : 'View Agent Plans'}
                    </Button>
                    <Button
                      className="w-full justify-start opacity-40 cursor-not-allowed focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none"
                      variant="outline"
                      disabled
                    >
                      Add Additional Regions
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
