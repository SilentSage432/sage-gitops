'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2 } from 'lucide-react';
import { OCTGuard } from '@/components/OCTGuard';

export default function CompletePage() {
  const { company, dataRegionsConfig, agentSelection, accessConfig } = useOnboardingStore();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Redirect if store is empty (user accessed /complete directly)
  useEffect(() => {
    const hasRequiredData = 
      company &&
      company.name &&
      company.email &&
      dataRegionsConfig &&
      dataRegionsConfig.selectedRegions.length > 0 &&
      agentSelection &&
      agentSelection.selectedAgents.length > 0 &&
      accessConfig;

    if (!hasRequiredData) {
      router.push('/onboarding/company');
      return;
    }

    // Auto-redirect to success page after 800ms
    setIsRedirecting(true);
    const redirectTimer = setTimeout(() => {
      router.push('/success');
    }, 800);

    return () => {
      clearTimeout(redirectTimer);
    };
  }, [company, dataRegionsConfig, agentSelection, accessConfig, router]);

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleStartAnother = () => {
    router.push('/onboarding/company');
  };

  // Don't render if redirecting
  if (!company || !dataRegionsConfig || !agentSelection || !accessConfig) {
    return null;
  }

  return (
    <OCTGuard>
      <div className="min-h-screen bg-[#0b0c0f] text-white flex items-center justify-center px-4">
        <div className="max-w-3xl mx-auto py-10 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-white/10 bg-[#111317] shadow-xl shadow-purple-500/10">
              <CardContent className="p-6 space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
                  className="flex justify-center mb-6"
                >
                  <div className="relative">
                    <CheckCircle2 className="w-20 h-20 text-[#10b981] drop-shadow-lg relative z-10" />
                    <div className="absolute inset-0 w-20 h-20 text-purple-400 opacity-40 blur-2xl animate-pulse" />
                    <div className="absolute inset-0 w-20 h-20 text-[#10b981] opacity-30 blur-xl" />
                  </div>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-3xl font-semibold tracking-tight text-[#e2e6ee]"
                >
                  Onboarding Complete
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-base leading-relaxed text-white/60 flex items-center justify-center gap-2"
                >
                  {isRedirecting ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin"></span>
                      Finalizing setup…
                    </>
                  ) : (
                    'The new tenant has been initialized and is ready for activation.'
                  )}
                </motion.p>

                <Separator className="my-6 bg-white/10" />

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="space-y-3"
                >
                  <Button
                    onClick={handleGoToDashboard}
                    className="w-full px-6 py-3 text-base"
                    size="lg"
                  >
                    Go to Dashboard
                  </Button>

                  <Button
                    onClick={handleStartAnother}
                    variant="outline"
                    className="w-full px-6 py-3 text-base"
                  >
                    Start Another Onboarding
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </OCTGuard>
  );
}
