'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Target, GraduationCap, Terminal, Users, BarChart3 } from 'lucide-react';
import { PersonalMeshNode, LiveStatusPanel, generateUUID } from '@/components/PersonalMeshNode';
import { EventFeed } from '@/components/EventFeed';
import { PersonalCommandLog } from '@/components/PersonalCommandLog';
import { PersonalCommandBar } from '@/components/PersonalCommandBar';

interface PersonalData {
  fullName: string;
  email: string;
  callsign: string;
  intent: string;
}

export default function PersonalDashboardPage() {
  const [personalData, setPersonalData] = useState<PersonalData | null>(null);
  const [nodeId, setNodeId] = useState<string>('');
  const [isActivating, setIsActivating] = useState(true);
  const [lastPulse, setLastPulse] = useState<Date>(new Date());

  useEffect(() => {
    // Check if onboarding is complete
    const isComplete = localStorage.getItem('personalOnboardingComplete');
    const storedData = localStorage.getItem('personalOnboardingData');

    if (!isComplete || !storedData) {
      // No routing - just set state to indicate not ready
      setPersonalData(null);
      return;
    }

    try {
      setPersonalData(JSON.parse(storedData));
    } catch (err) {
      console.error('Failed to parse personal data:', err);
      setPersonalData(null);
    }

    // Generate or load nodeId
    const storedNodeId = localStorage.getItem('personalNodeId');
    if (storedNodeId) {
      setNodeId(storedNodeId);
    } else {
      const newNodeId = generateUUID();
      localStorage.setItem('personalNodeId', newNodeId);
      setNodeId(newNodeId);
    }

    // Activation animation
    setTimeout(() => {
      setIsActivating(false);
    }, 1800);

    // Update pulse timestamp every 5 seconds (for status command)
    const pulseInterval = setInterval(() => {
      setLastPulse(new Date());
    }, 5000);

    return () => clearInterval(pulseInterval);
  }, []);

  if (!personalData || !nodeId) {
    return null; // Will redirect or wait for nodeId
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
    <div className="min-h-screen bg-[#0b0c0f] text-white relative">
      {/* Activation Overlay */}
      <AnimatePresence>
        {isActivating && (
          <motion.div
            initial={{ opacity: 1, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 0, backdropFilter: 'blur(20px)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
            className="fixed inset-0 bg-[#0b0c0f]/80 backdrop-blur-xl z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -20 }}
              transition={{ duration: 1.8, ease: 'easeOut' }}
              className="text-center"
            >
              <p className="text-xl font-semibold text-[#e2e6ee] mb-2">Bringing node online…</p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse delay-150" />
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse delay-300" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Dashboard Content */}
      <div className="animate-in fade-in duration-300 ease-out pb-24">
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
            {/* Mesh Node Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <PersonalMeshNode callsign={personalData.callsign} nodeId={nodeId} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
              >
                <LiveStatusPanel />
              </motion.div>
            </div>

            {/* Event Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <EventFeed />
            </motion.div>

            {/* Command Terminal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <PersonalCommandLog />
            </motion.div>

            {/* Intent-based Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderIntentModules()}
            </div>
          </div>
        </div>
      </div>

      {/* Command Bar - Fixed at bottom */}
      {!isActivating && personalData && nodeId && (
        <PersonalCommandBar
          nodeId={nodeId}
          callsign={personalData.callsign}
          onStatusRequest={() => ({
            meshReachability: 'OK',
            heartbeatSync: 'Active',
            cognitiveLink: 'Initializing',
            lastPulse,
          })}
        />
      )}
    </div>
  );
}
