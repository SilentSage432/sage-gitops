'use client';

import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OCTGuard } from '@/components/OCTGuard';
import { CheckCircle2, Clock, Building2, MapPin, Calendar } from 'lucide-react';

export default function DashboardPage() {
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

  return (
    <OCTGuard>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-[#0b0c0f] text-white"
      >
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header Bar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-semibold mb-2 text-[#e2e6ee]">
              SAGE Onboarding Dashboard
            </h1>
            <p className="text-white/60">
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
              <Card className="border-white/10 bg-[#111317] shadow-lg shadow-purple-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#6366f1]" />
                    Tenant Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <Card className="border-white/10 bg-[#111317]">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60">Bootstrap Status</span>
                    <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <Badge variant="default" className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30">
                    ✅ Ready
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-[#111317]">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60">OCT Status</span>
                    <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <Badge variant="default" className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30">
                    ✅ Active
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-[#111317]">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60">Next Rotation</span>
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
                      className="w-full justify-start"
                      variant="outline"
                    >
                      Generate New Bootstrap Kit
                    </Button>
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                    >
                      View Agent Plans
                    </Button>
                    <Button
                      className="w-full justify-start"
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
                  <ul className="space-y-4">
                    {activityItems.map((item, index) => (
                      <li key={index} className="flex flex-col gap-1 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                        <span className="text-sm text-[#e2e6ee]">{item.action}</span>
                        <span className="text-xs text-white/40">{item.timestamp}</span>
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
