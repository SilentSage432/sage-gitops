'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OCTGuard } from '@/components/OCTGuard';
import { ArrowLeft } from 'lucide-react';

export default function PersonalOnboardingPage() {
  const router = useRouter();

  return (
    <OCTGuard>
      <div className="min-h-screen bg-[#0b0c0f] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-white/10 bg-[#111317]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/onboarding/select')}
                    className="mr-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  Individual Onboarding
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-white/60 text-center py-8">
                  Personal onboarding coming soon
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/onboarding/select')}
                >
                  Back to Selection
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </OCTGuard>
  );
}

