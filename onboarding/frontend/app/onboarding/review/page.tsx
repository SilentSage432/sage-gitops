'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OCTGuard } from '@/components/OCTGuard';
import { CheckCircle2 } from 'lucide-react';

const agentNameMap: Record<string, string> = {
  'researcher': 'Researcher Agent',
  'audit-logger': 'Audit Logger',
  'etl-lite': 'ETL-Lite',
  'notification-relay': 'Notification Relay',
  'observer': 'Observer Agent',
};

const regionNameMap: Record<string, string> = {
  'us-east': 'US-East',
  'us-west': 'US-West',
  'eu': 'EU',
  'apac': 'APAC',
};

export default function ReviewPage() {
  const {
    company,
    dataRegionsConfig,
    agentSelection,
    accessConfig,
  } = useOnboardingStore();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [kitFingerprint, setKitFingerprint] = useState<string>('');

  // Validate required data and redirect if missing
  useEffect(() => {
    if (!company || !company.name || !company.email) {
      router.push('/onboarding/company');
      return;
    }
    if (!dataRegionsConfig || dataRegionsConfig.selectedRegions.length === 0) {
      router.push('/onboarding/data-regions');
      return;
    }
    if (!agentSelection || agentSelection.selectedAgents.length === 0) {
      router.push('/onboarding/agents');
      return;
    }
    if (!accessConfig) {
      router.push('/onboarding/access');
      return;
    }
  }, [company, dataRegionsConfig, agentSelection, accessConfig, router]);

  const handleBack = () => {
    router.push('/onboarding/access');
  };

  const handleGenerateKit = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate success if bypass is enabled
      if (process.env.NEXT_PUBLIC_BYPASS_YUBIKEY === 'true') {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setKitFingerprint('sha256:' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .substring(0, 64));
        setIsSuccess(true);
      } else {
        // Call actual API endpoint (stub for now)
        const response = await fetch('/api/bootstrap/kit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            company,
            dataRegionsConfig,
            agentSelection,
            accessConfig,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setKitFingerprint(data.fingerprint || '');
          setIsSuccess(true);
        } else {
          throw new Error('Failed to generate kit');
        }
      }
    } catch (error) {
      console.error('Error generating kit:', error);
      alert('Failed to generate bootstrap kit. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyVerificationCommand = () => {
    const command = `sage verify-kit --fingerprint "${kitFingerprint}"`;
    navigator.clipboard.writeText(command);
    // Could show a toast here
  };

  const handleFinish = () => {
    router.push('/dashboard');
  };

  const isFormValid = () => {
    return (
      company &&
      company.name &&
      company.email &&
      dataRegionsConfig &&
      dataRegionsConfig.selectedRegions.length > 0 &&
      agentSelection &&
      agentSelection.selectedAgents.length > 0 &&
      accessConfig &&
      (accessConfig.authMethod === 'local' ? accessConfig.adminEmail : 
       accessConfig.authMethod === 'sso' ? accessConfig.clientId && accessConfig.clientSecret : false)
    );
  };

  if (isSuccess) {
    return (
      <OCTGuard>
        <div className="min-h-screen bg-[#0b0c0f] text-white pb-24">
          <div className="max-w-3xl mx-auto px-4 py-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-[#111317] border border-white/10 p-8 rounded-[14px] text-center"
            >
              <div className="flex justify-center mb-6">
                <CheckCircle2 className="w-16 h-16 text-[#10b981]" />
              </div>
              <h2 className="text-2xl font-semibold mb-2 text-[#e2e6ee]">
                Bootstrap Kit Ready
              </h2>
              <p className="text-white/60 mb-8">
                Deliver this package to the tenant runtime
              </p>

              {kitFingerprint && (
                <div className="mb-8 p-4 bg-[#1a1d22] border border-white/10 rounded-[14px] text-left">
                  <p className="text-sm font-medium text-white/60 mb-2">Kit Fingerprint:</p>
                  <p className="text-sm font-mono text-[#e2e6ee] break-all">{kitFingerprint}</p>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  disabled
                  className="w-full px-6"
                  variant="outline"
                >
                  Download Kit (Coming Soon)
                </Button>
                
                {kitFingerprint && (
                  <Button
                    onClick={handleCopyVerificationCommand}
                    variant="outline"
                    className="w-full px-6"
                  >
                    Copy Verification Command
                  </Button>
                )}

                <Button
                  onClick={handleFinish}
                  className="w-full px-6"
                >
                  Finish
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </OCTGuard>
    );
  }

  if (!company || !dataRegionsConfig || !agentSelection || !accessConfig) {
    return null; // Will redirect in useEffect
  }

  return (
    <OCTGuard>
      <div className="min-h-screen bg-[#0b0c0f] text-white pb-24">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-2 text-[#e2e6ee]">
                Review Configuration
              </h2>
              <p className="text-white/60">
                Review your onboarding configuration before generating the bootstrap kit
              </p>
            </div>

            <ScrollArea className="max-h-[calc(100vh-300px)]">
              <div className="space-y-8">
                {/* Company Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Company Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm text-white/60">Company Name:</span>
                      <p className="text-sm text-[#e2e6ee] font-medium">{company.name}</p>
                    </div>
                    {company.industry && (
                      <div>
                        <span className="text-sm text-white/60">Industry:</span>
                        <p className="text-sm text-[#e2e6ee] font-medium">{company.industry}</p>
                      </div>
                    )}
                    {company.size && (
                      <div>
                        <span className="text-sm text-white/60">Company Size:</span>
                        <p className="text-sm text-[#e2e6ee] font-medium">{company.size}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-white/60">Contact Email:</span>
                      <p className="text-sm text-[#e2e6ee] font-medium">{company.email}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Data & Regions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Data & Regions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dataRegionsConfig.sensitivity && (
                      <div>
                        <span className="text-sm text-white/60">Data Sensitivity:</span>
                        <Badge className="ml-2">{dataRegionsConfig.sensitivity}</Badge>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-white/60">Selected Regions:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {dataRegionsConfig.selectedRegions.map((regionId) => (
                          <Badge key={regionId} variant="secondary">
                            {regionNameMap[regionId] || regionId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-white/60">Data Residency Required:</span>
                      <p className="text-sm text-[#e2e6ee] font-medium">
                        {dataRegionsConfig.residencyRequired ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Initial Agents */}
                <Card>
                  <CardHeader>
                    <CardTitle>Initial Agents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {agentSelection.selectedAgents.map((agentId) => (
                        <Badge key={agentId} variant="secondary">
                          {agentNameMap[agentId] || agentId}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Access & Authentication */}
                <Card>
                  <CardHeader>
                    <CardTitle>Access & Authentication</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm text-white/60">Authentication Method:</span>
                      <p className="text-sm text-[#e2e6ee] font-medium">
                        {accessConfig.authMethod === 'local' ? 'Local Accounts' : 'SSO (OIDC / SAML)'}
                      </p>
                    </div>

                    {accessConfig.authMethod === 'local' && (
                      <>
                        {accessConfig.adminEmail && (
                          <div>
                            <span className="text-sm text-white/60">Admin Email:</span>
                            <p className="text-sm text-[#e2e6ee] font-medium">{accessConfig.adminEmail}</p>
                          </div>
                        )}
                      </>
                    )}

                    {accessConfig.authMethod === 'sso' && (
                      <>
                        {accessConfig.identityProvider && (
                          <div>
                            <span className="text-sm text-white/60">Identity Provider:</span>
                            <p className="text-sm text-[#e2e6ee] font-medium">{accessConfig.identityProvider}</p>
                          </div>
                        )}
                        {accessConfig.callbackUrl && (
                          <div>
                            <span className="text-sm text-white/60">Callback URL:</span>
                            <p className="text-sm text-[#e2e6ee] font-mono text-xs break-all">{accessConfig.callbackUrl}</p>
                          </div>
                        )}
                        {accessConfig.scimEnabled && (
                          <div>
                            <span className="text-sm text-white/60">SCIM Provisioning:</span>
                            <p className="text-sm text-[#e2e6ee] font-medium">Enabled</p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>

            <Separator className="my-8" />

            <div className="flex justify-center">
              <Button
                onClick={handleGenerateKit}
                disabled={!isFormValid() || isGenerating}
                className="px-8 py-3 text-lg"
                size="lg"
              >
                {isGenerating ? 'Generating Kit...' : 'Generate Bootstrap Kit'}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#111317] border-t border-white/10 p-4">
          <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              className="px-6"
            >
              &lt; Back
            </Button>
            
            <div className="text-sm text-white/60">
              Step 5
            </div>

            <div className="w-24" /> {/* Spacer for alignment */}
          </div>
        </div>
      </div>
    </OCTGuard>
  );
}
