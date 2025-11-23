'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { User, Search, Network, BookOpen } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-[#0b0c0f] text-white animate-in fade-in duration-300 ease-out">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-semibold tracking-tight mb-2 text-[#e2e6ee]">
            Welcome, {personalData.fullName.split(' ')[0]}
          </h1>
          <p className="text-sm text-neutral-400">
            Your personal SAGE dashboard
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Identity Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="rounded-3xl bg-neutral-900/40 border border-white/10 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-violet-400" />
                  Identity Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-white/60">Full Name</p>
                  <p className="text-sm font-medium text-[#e2e6ee]">{personalData.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Email</p>
                  <p className="text-sm font-medium text-[#e2e6ee]">{personalData.email}</p>
                </div>
                {personalData.callsign && (
                  <div>
                    <p className="text-sm text-white/60">Callsign</p>
                    <p className="text-sm font-medium text-[#e2e6ee]">{personalData.callsign}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-white/60">Intent</p>
                  <p className="text-sm font-medium text-[#e2e6ee]">
                    {intentLabels[personalData.intent] || personalData.intent}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Agent Discovery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="rounded-3xl bg-neutral-900/40 border border-white/10 backdrop-blur hover:border-white/20 transition-all h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Search className="w-5 h-5 text-violet-400" />
                    Agent Discovery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/60">
                    Coming soon
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Personal Mesh Node */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="rounded-3xl bg-neutral-900/40 border border-white/10 backdrop-blur hover:border-white/20 transition-all h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Network className="w-5 h-5 text-violet-400" />
                    Personal Mesh Node
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/60">
                    Future
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Knowledge Stream */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="rounded-3xl bg-neutral-900/40 border border-white/10 backdrop-blur hover:border-white/20 transition-all h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="w-5 h-5 text-violet-400" />
                    Knowledge Stream
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/60">
                    Explore the SAGE knowledge base
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

