'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Building2 } from 'lucide-react';

export function OnboardingEntry() {
  const router = useRouter();

  const handleIndividual = () => {
    router.push('/onboarding/personal');
  };

  const handleOrganization = () => {
    router.push('/onboarding/organization');
  };

  return (
    <div className="min-h-screen bg-[#0b0c0f] text-white flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-semibold tracking-tight text-[#e2e6ee]">SAGE Onboarding</h1>
          <p className="text-base leading-relaxed text-white/60 mt-2">Choose your onboarding path</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Individual Onboarding Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <button
              onClick={handleIndividual}
              className="w-full h-full p-8 rounded-3xl bg-neutral-900/40 border border-white/10 backdrop-blur hover:scale-[1.02] hover:border-white/20 transition-all focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none text-left group"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/30 transition-colors">
                  <User className="w-8 h-8 text-violet-400" />
                </div>
                <h2 className="text-xl font-medium text-[#e2e6ee]">Individual Onboarding</h2>
                <p className="text-sm text-white/60">
                  Set up your personal SAGE instance
                </p>
              </div>
            </button>
          </motion.div>

          {/* Organization Onboarding Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <button
              onClick={handleOrganization}
              className="w-full h-full p-8 rounded-3xl bg-neutral-900/40 border border-white/10 backdrop-blur hover:scale-[1.02] hover:border-white/20 transition-all focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none text-left group"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/30 transition-colors">
                  <Building2 className="w-8 h-8 text-violet-400" />
                </div>
                <h2 className="text-xl font-medium text-[#e2e6ee]">Organization Onboarding</h2>
                <p className="text-sm text-white/60">
                  Configure SAGE for your organization
                </p>
              </div>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

