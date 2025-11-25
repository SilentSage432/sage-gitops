'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OCTGuard } from '@/components/OCTGuard';
import { CheckCircle2, Copy, Check, QrCode, ChevronDown, ChevronUp } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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
  const [fingerprintCopied, setFingerprintCopied] = useState(false);
  const [commandCopied, setCommandCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(15 * 60); // 15 minutes in seconds
  const [isExpired, setIsExpired] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [tenantId, setTenantId] = useState<string>('');

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

  // Countdown timer
  useEffect(() => {
    if (!isSuccess || isExpired) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSuccess, isExpired]);

  // Format time remaining as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get countdown color based on time remaining
  const getCountdownColor = (seconds: number): string => {
    if (seconds <= 60) return 'text-red-500';
    if (seconds <= 300) return 'text-yellow-500';
    return 'text-white/80';
  };

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
        // Generate a proper SHA-256-like fingerprint
        const hashBytes = crypto.getRandomValues(new Uint8Array(32));
        const hashHex = Array.from(hashBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        setKitFingerprint(`sha256:${hashHex}`);
        setIsSuccess(true);
        setTimeRemaining(15 * 60); // Reset timer on success
        setIsExpired(false);
      } else {
        const octToken = localStorage.getItem('oct-storage') ? JSON.parse(localStorage.getItem('oct-storage')!).token : '';
        if (!octToken) {
          throw new Error('No access token available');
        }

        // Step 1: Create tenant first (if not already created)
        let currentTenantId = tenantId || localStorage.getItem('lastTenantId') || '';
        
        if (!currentTenantId) {
          const tenantResponse = await fetch('/api/onboarding/tenants', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${octToken}`,
            },
            body: JSON.stringify({
              company,
              dataRegionsConfig,
              agentSelection,
              accessConfig,
            }),
          });

          if (!tenantResponse.ok) {
            const errorText = await tenantResponse.text();
            throw new Error(`Failed to create tenant: ${errorText}`);
          }

          const tenantData = await tenantResponse.json();
          currentTenantId = tenantData.tenantID || tenantData.tenantId;
          if (currentTenantId) {
            setTenantId(currentTenantId);
            localStorage.setItem('lastTenantId', currentTenantId);
          }
        }

        // Step 2: Generate bootstrap kit
        const response = await fetch(`/api/onboarding/bootstrap/kit?tenantId=${currentTenantId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${octToken}`,
          },
          body: JSON.stringify({
            company,
            dataRegionsConfig,
            agentSelection,
            accessConfig,
          }),
        });
        
        if (response.ok) {
          // Check if response is ZIP (application/zip) or JSON
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/zip')) {
            // Download the ZIP file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bootstrap-${company?.name?.replace(/\s+/g, '-').toLowerCase() || 'kit'}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            // Step 3: Get fingerprint from meta endpoint
            if (currentTenantId) {
              try {
                const metaResponse = await fetch(`/api/onboarding/bootstrap/meta/${currentTenantId}`, {
                  headers: {
                    'Authorization': `Bearer ${octToken}`,
                  },
                });
                
                if (metaResponse.ok) {
                  const meta = await metaResponse.json();
                  if (meta.fingerprint) {
                    setKitFingerprint(meta.fingerprint);
                    localStorage.setItem('bootstrap-fingerprint', meta.fingerprint);
                  }
                }
              } catch (err) {
                console.error('Failed to fetch meta:', err);
                // Generate placeholder fingerprint
                const hashBytes = crypto.getRandomValues(new Uint8Array(32));
                const hashHex = Array.from(hashBytes)
                  .map(b => b.toString(16).padStart(2, '0'))
                  .join('');
                setKitFingerprint(`sha256:${hashHex}`);
              }
            }
          } else {
            // JSON response (fallback)
            const data = await response.json();
            setKitFingerprint(data.fingerprint || '');
          }
          
          setIsSuccess(true);
          setTimeRemaining(15 * 60); // Reset timer on success
          setIsExpired(false);
        } else {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to generate kit');
        }
      }
    } catch (error) {
      console.error('Error generating kit:', error);
      alert('Failed to generate bootstrap kit. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyFingerprint = async () => {
    try {
      await navigator.clipboard.writeText(kitFingerprint);
      setFingerprintCopied(true);
      setTimeout(() => setFingerprintCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy fingerprint:', err);
    }
  };

  const handleCopyVerificationCommand = async () => {
    const currentTenantId = tenantId || localStorage.getItem('lastTenantId') || '';
    const command = currentTenantId 
      ? `sage verify-kit --tenant ${currentTenantId} --fingerprint "${kitFingerprint}"`
      : `sage verify-kit --fingerprint "${kitFingerprint}"`;
    try {
      await navigator.clipboard.writeText(command);
      setCommandCopied(true);
      setTimeout(() => setCommandCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy command:', err);
    }
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
        <div className="min-h-[100svh] flex flex-col bg-[#0b0c0f] text-white">
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overscroll-behavior-contain pt-safe pb-safe px-4 py-6">
            <div className="max-w-3xl mx-auto">
              <div className="bg-[#111317] border border-white/10 p-6 rounded-[14px] text-center">
              <div className="flex justify-center mb-6">
                <CheckCircle2 className="w-16 h-16 text-[#10b981]" />
              </div>
            </div>
              <h2 className="text-3xl font-semibold tracking-tight text-[#e2e6ee]">
                Bootstrap Kit Ready
              </h2>
              <p className="text-base leading-relaxed text-white/60 mt-2">
                Deliver this package to the tenant runtime
              </p>

              {kitFingerprint && (
                <div className="mb-8 p-4 bg-[#1a1d22] border border-white/10 rounded-[14px] text-left">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white/60">SHA-256 Fingerprint:</p>
                    <Button
                      onClick={handleCopyFingerprint}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-xs"
                    >
                      {fingerprintCopied ? (
                        <>
                          <Check className="w-3 h-3 mr-1.5 text-[#10b981]" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1.5" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <code className="text-xs font-mono text-[#e2e6ee] break-all block bg-[#0b0c0f] p-2 rounded border border-white/5">
                    {kitFingerprint}
                  </code>
                </div>
              )}

              {/* Countdown Timer */}
              {isSuccess && !isExpired && (
                <div className="mb-8 p-4 bg-[#1a1d22] border border-white/10 rounded-[14px] text-center">
                  <p className="text-sm font-medium text-white/60 mb-2">Expires in:</p>
                  <p className={`text-2xl font-mono font-semibold ${getCountdownColor(timeRemaining)}`}>
                    {formatTime(timeRemaining)}
                  </p>
                </div>
              )}

              {isExpired && (
                <div className="mb-8 p-4 bg-[#1a1d22] border border-red-500/30 rounded-[14px] text-center">
                  <p className="text-sm font-medium text-red-500 mb-2">Kit Expired</p>
                  <p className="text-xs text-white/60">This bootstrap kit has expired and is no longer valid.</p>
                </div>
              )}

              {/* Optional QR Code */}
              {kitFingerprint && (
                <div className="mb-8">
                  <Button
                    onClick={() => setShowQR(!showQR)}
                    variant="ghost"
                    className="w-full justify-between text-sm text-white/60 hover:text-white"
                  >
                    <span className="flex items-center gap-2">
                      <QrCode className="w-4 h-4" />
                      QR Code Handoff
                    </span>
                    {showQR ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                  {showQR && (
                    <div className="mt-4 p-4 bg-[#1a1d22] border border-white/10 rounded-[14px] flex flex-col items-center">
                      <QRCodeSVG
                        value={`${window.location.origin}/api/onboarding/bootstrap/verify?tenantId=${tenantId || localStorage.getItem('lastTenantId') || ''}&fingerprint=${kitFingerprint}`}
                        size={200}
                        level="M"
                        includeMargin={true}
                        className="bg-white p-2 rounded"
                      />
                      <p className="text-xs text-white/60 mt-4 text-center font-mono break-all">
                        Verify: {tenantId || localStorage.getItem('lastTenantId') || 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={async () => {
                    const octToken = localStorage.getItem('oct-storage') ? JSON.parse(localStorage.getItem('oct-storage')!).token : '';
                    const currentTenantId = tenantId || localStorage.getItem('lastTenantId') || '';
                    if (!currentTenantId) {
                      alert('No tenant ID available. Please generate the kit first.');
                      return;
                    }
                    try {
                      const response = await fetch(`/api/onboarding/bootstrap/kit?tenantId=${currentTenantId}`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${octToken}`,
                        },
                      });
                      if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `bootstrap-${company?.name?.replace(/\s+/g, '-').toLowerCase() || currentTenantId.substring(0, 8) || 'kit'}.zip`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      }
                    } catch (err) {
                      console.error('Download error:', err);
                      alert('Failed to download kit');
                    }
                  }}
                  disabled={isExpired}
                  className="w-full px-6"
                  variant="outline"
                >
                  {isExpired ? 'Download Kit (Expired)' : 'Download Kit'}
                </Button>

                {isExpired && (
                  <Button
                    disabled
                    className="w-full px-6 opacity-50"
                    variant="outline"
                  >
                    Regenerate Kit (Coming Soon)
                  </Button>
                )}
                
                {kitFingerprint && (
                  <Button
                    onClick={handleCopyVerificationCommand}
                    variant="outline"
                    className="w-full px-6"
                  >
                    {commandCopied ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-[#10b981]" />
                        Command Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Verification Command
                      </>
                    )}
                  </Button>
                )}

                <Button
                  onClick={handleFinish}
                  className="w-full px-6"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Finish
                </Button>
              </div>
            </div>
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
      <div className="min-h-[100svh] flex flex-col bg-[#0b0c0f] text-white">
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overscroll-behavior-contain pt-safe pb-safe px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-8 fade-in">
            <div>
              <div className="mb-6">
              <h2 className="text-3xl font-semibold tracking-tight text-[#e2e6ee]">
                Review Configuration
              </h2>
              <p className="text-sm text-white/60 mt-2">
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
                className="w-full sm:w-auto px-8 py-3 text-lg"
                size="lg"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating Kit...' : 'Generate Bootstrap Kit'}
              </Button>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#111317] border-t border-white/10 p-4">
          <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleBack}
              className="w-full sm:w-auto px-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="text-sm text-white/60 hidden sm:block">
              Step 5
            </div>

            <div className="hidden sm:block w-24" /> {/* Spacer for alignment */}
          </div>
        </div>
      </div>
      </div>
    </OCTGuard>
  );
}

