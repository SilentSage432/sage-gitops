'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Target, GraduationCap, Terminal, Users, BarChart3 } from 'lucide-react';

interface PersonalData {
  fullName: string;
  email: string;
  callsign: string;
  intent: string;
}

export default function PersonalDashboardPage() {
  const router = useRouter();
  const [personalData, setPersonalData] = useState<PersonalData | null>(null);

  useEffect(() => {
    // Check if onboarding is complete
    const isComplete = localStorage.getItem('personalOnboardingComplete');
    const storedData = localStorage.getItem('personalOnboardingData');

    if (!isComplete || !storedData) {
      // Redirect to onboarding if not complete
      router.push('/onboarding/personal');
      return;
    }

    try {
      setPersonalData(JSON.parse(storedData));
    } catch (err) {
      console.error('Failed to parse personal data:', err);
      router.push('/onboarding/personal');
    }
  }, [router]);

  if (!personalData) {
    return null; // Will redirect
  }

  const intentLabels: Record<string, string> = {
    learn: 'Learn & Explore',
    operator: 'Become an Operator',
    federation: 'Future Federation Member',
  };

  const displayIntent = intentLabels[personalData.intent] || personalData.intent;

  // Render intent-based modules
  const renderIntentModules = () => {
    switch (personalData.intent) {
      case 'learn':
        return (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="rounded-3xl bg-neutral-900/60 border border-white/10 backdrop-blur hover:border-white/20 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-violet-400" />
                    Knowledge Stream
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/60">
                    Explore the SAGE knowledge base and documentation
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="rounded-3xl bg-neutral-900/60 border border-white/10 backdrop-blur hover:border-white/20 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-violet-400" />
                    Guided Missions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/60">
                    Interactive tutorials and learning paths
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        );

      case 'operator':
        return (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="rounded-3xl bg-neutral-900/60 border border-white/10 backdrop-blur hover:border-white/20 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-violet-400" />
                    Operator Training
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/60">
                    Complete your operator certification program
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="rounded-3xl bg-neutral-900/60 border border-white/10 backdrop-blur hover:border-white/20 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-violet-400" />
                    Command Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/60">
                    Practice with SAGE command interface
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        );

      case 'federation':
        return (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="rounded-3xl bg-neutral-900/60 border border-white/10 backdrop-blur hover:border-white/20 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-violet-400" />
                    Early Access Queue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/60">
                    Your position in the federation access queue
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="rounded-3xl bg-neutral-900/60 border border-white/10 backdrop-blur hover:border-white/20 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-violet-400" />
                    Readiness Tracker
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/60">
                    Track your progress toward federation readiness
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c0f] text-white animate-in fade-in duration-300 ease-out">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header with Status Badges */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold tracking-tight mb-2 text-[#e2e6ee]">
                Welcome back, {personalData.fullName}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-sm text-neutral-400">
                  Mode: <span className="text-violet-400 font-medium">{displayIntent}</span>
                </p>
                {personalData.callsign && (
                  <span className="text-xs text-white/40">•</span>
                )}
                {personalData.callsign && (
                  <p className="text-sm text-neutral-400">
                    Callsign: <span className="text-violet-400 font-medium">{personalData.callsign}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge variant="secondary" className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-xs">
                ONBOARDING COMPLETE
              </Badge>
              <Badge variant="secondary" className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-xs">
                PERSONAL MODE ACTIVE
              </Badge>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Intent-based Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderIntentModules()}
          </div>
        </div>
      </div>
    </div>
  );
}
