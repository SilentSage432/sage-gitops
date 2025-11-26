'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { RadioGroup } from '@/components/ui/radio-group';
import { Select, SelectOption } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { OCTGuard } from '@/components/OCTGuard';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Generate a secure random password
const generatePassword = (): string => {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const values = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(values, (x) => charset[x % charset.length]).join('');
};

const authMethodOptions = [
  { value: 'local', label: 'Local accounts only' },
  { value: 'sso', label: 'SSO (OIDC / SAML)' },
];

// Identity providers will be fetched from API (Phase 10)
const identityProviderOptions = [
  'Okta',
  'Azure AD',
  'Google Workspace',
  'OneLogin',
  'Other',
];

const getCallbackUrl = () => {
  if (typeof window !== 'undefined') {
    return `${process.env.NEXT_PUBLIC_ONBOARDING_URL || window.location.origin}/auth/callback`;
  }
  return `${process.env.NEXT_PUBLIC_ONBOARDING_URL || 'https://onboarding.example.com'}/auth/callback`;
};

export default function AccessPage() {
  const { accessConfig, setAccessConfig } = useOnboardingStore();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    authMethod: accessConfig?.authMethod || 'local',
    scimEnabled: accessConfig?.scimEnabled || false,
    identityProvider: accessConfig?.identityProvider || '',
    clientId: accessConfig?.clientId || '',
    clientSecret: accessConfig?.clientSecret || '',
    adminEmail: accessConfig?.adminEmail || '',
    tempPassword: accessConfig?.tempPassword || '',
  });

  const [errors, setErrors] = useState<{
    adminEmail?: string;
    clientId?: string;
    clientSecret?: string;
  }>({});
  
  const [identityProviders, setIdentityProviders] = useState<Array<{id: string; name: string; type: string; description: string}>>([]);
  const [validating, setValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{valid: boolean; message?: string} | null>(null);

  // Fetch identity providers on mount (Phase 10)
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const res = await fetch(`${API_BASE_URL}/api/onboarding/identity/providers`);
        if (res.ok) {
          const data = await res.json();
          setIdentityProviders(data.providers || []);
        }
      } catch (err) {
        console.error('Failed to fetch identity providers:', err);
      }
    };
    fetchProviders();
  }, []);

  // Generate password on mount if local auth and no password exists
  useEffect(() => {
    if (formData.authMethod === 'local' && !formData.tempPassword) {
      setFormData((prev) => ({
        ...prev,
        tempPassword: generatePassword(),
      }));
    }
  }, []);

  // Validate form
  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (formData.authMethod === 'local') {
      if (!formData.adminEmail.trim()) {
        newErrors.adminEmail = 'Admin email is required';
      } else if (!emailRegex.test(formData.adminEmail)) {
        newErrors.adminEmail = 'Please enter a valid email address';
      }
    } else if (formData.authMethod === 'sso') {
      if (!formData.clientId.trim()) {
        newErrors.clientId = 'Client ID is required';
      }
      if (!formData.clientSecret.trim()) {
        newErrors.clientSecret = 'Client Secret is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid
  const isFormValid = () => {
    if (formData.authMethod === 'local') {
      return formData.adminEmail.trim().length > 0 && 
             emailRegex.test(formData.adminEmail);
    } else {
      return formData.clientId.trim().length > 0 && 
             formData.clientSecret.trim().length > 0;
    }
  };

  // Validate on change
  useEffect(() => {
    if (formData.authMethod === 'local' && formData.adminEmail) {
      validateForm();
    } else if (formData.authMethod === 'sso' && (formData.clientId || formData.clientSecret)) {
      validateForm();
    }
  }, [formData.authMethod, formData.adminEmail, formData.clientId, formData.clientSecret]);

  const handleBack = () => {
    router.push('/onboarding/agents');
  };

  // Phase 10: Validate identity configuration
  const handleValidateIdentity = async () => {
    if (formData.authMethod !== 'sso') return;
    
    const tenantId = localStorage.getItem('lastTenantId');
    if (!tenantId) {
      setValidationStatus({ valid: false, message: 'No tenant ID found. Please complete previous steps.' });
      return;
    }

    setValidating(true);
    setValidationStatus(null);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${API_BASE_URL}/api/onboarding/identity/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenantId,
          identityProvider: formData.identityProvider,
          clientId: formData.clientId,
          clientSecret: formData.clientSecret,
          callbackUrl: getCallbackUrl(),
          scimEnabled: formData.scimEnabled,
        }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setValidationStatus({ valid: true, message: 'Identity configuration validated successfully' });
      } else {
        setValidationStatus({ valid: false, message: data.message || 'Validation failed' });
      }
    } catch (err) {
      setValidationStatus({ valid: false, message: 'Failed to validate identity configuration' });
    } finally {
      setValidating(false);
    }
  };

  const handleNext = () => {
    if (validateForm()) {
      setAccessConfig({
        authMethod: formData.authMethod as 'local' | 'sso',
        scimEnabled: formData.scimEnabled,
        identityProvider: formData.identityProvider as any || undefined,
        clientId: formData.clientId || undefined,
        clientSecret: formData.clientSecret || undefined,
        callbackUrl: formData.authMethod === 'sso' ? getCallbackUrl() : undefined,
        adminEmail: formData.authMethod === 'local' ? formData.adminEmail : undefined,
        tempPassword: formData.authMethod === 'local' ? formData.tempPassword : undefined,
      });
      router.push('/onboarding/review');
    }
  };

  return (
    <OCTGuard>
      <div className="min-h-[100svh] flex flex-col bg-[#0b0c0f] text-white">
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overscroll-behavior-contain pt-safe pb-safe px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-8 fade-in">
            <div>
              <div className="bg-[#111317] border border-white/10 p-6 rounded-[14px]">
              <h2 className="text-xl font-medium mb-4 text-[#e2e6ee]">
                Access & Authentication
              </h2>
              
              <div className="space-y-4">
                {/* Authentication Method */}
                <div className="space-y-3">
                  <Label>Authentication Method</Label>
                  <RadioGroup
                    options={authMethodOptions}
                    value={formData.authMethod}
                    onValueChange={(value) => {
                      setFormData({ ...formData, authMethod: value as 'local' | 'sso' });
                      // Generate password when switching to local
                      if (value === 'local' && !formData.tempPassword) {
                        setFormData((prev) => ({
                          ...prev,
                          authMethod: value as 'local' | 'sso',
                          tempPassword: generatePassword(),
                        }));
                      }
                    }}
                  />
                </div>

                <Separator />

                {/* Local Account Fields */}
                {formData.authMethod === 'local' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="adminEmail">
                        Admin Email <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                        placeholder="Enter admin email"
                        className={errors.adminEmail ? 'border-red-400' : ''}
                      />
                      {errors.adminEmail && (
                        <p className="text-sm text-red-400">{errors.adminEmail}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tempPassword">Temporary Password</Label>
                      <Input
                        id="tempPassword"
                        type="text"
                        value={formData.tempPassword}
                        readOnly
                        className="bg-[#0b0c0f] cursor-not-allowed"
                      />
                      <p className="text-xs text-white/60">
                        This password will be used for the initial admin login. User must change it on first login.
                      </p>
                    </div>
                  </div>
                )}

                {/* SSO Fields */}
                {formData.authMethod === 'sso' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="identityProvider">Identity Provider</Label>
                      <Select
                        id="identityProvider"
                        value={formData.identityProvider}
                        onChange={(e) => setFormData({ ...formData, identityProvider: e.target.value })}
                      >
                        <SelectOption value="">Select identity provider</SelectOption>
                        {identityProviders.length > 0 ? (
                          identityProviders.map((provider) => (
                            <SelectOption key={provider.id} value={provider.id}>
                              {provider.name} {provider.type && `(${provider.type.toUpperCase()})`}
                            </SelectOption>
                          ))
                        ) : (
                          identityProviderOptions.map((provider) => (
                            <SelectOption key={provider} value={provider}>
                              {provider}
                            </SelectOption>
                          ))
                        )}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="callbackUrl">Callback URL</Label>
                      <Input
                        id="callbackUrl"
                        type="text"
                        value={getCallbackUrl()}
                        readOnly
                        className="bg-[#0b0c0f] cursor-not-allowed"
                      />
                      <p className="text-xs text-white/60">
                        Configure this URL in your identity provider settings
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientId">
                        Client ID <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="clientId"
                        type="text"
                        value={formData.clientId}
                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                        placeholder="Enter client ID"
                        className={errors.clientId ? 'border-red-400' : ''}
                      />
                      {errors.clientId && (
                        <p className="text-sm text-red-400">{errors.clientId}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientSecret">
                        Client Secret <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="clientSecret"
                        type="password"
                        value={formData.clientSecret}
                        onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                        placeholder="Enter client secret"
                        className={errors.clientSecret ? 'border-red-400' : ''}
                      />
                      {errors.clientSecret && (
                        <p className="text-sm text-red-400">{errors.clientSecret}</p>
                      )}
                    </div>

                    {/* SCIM Provisioning */}
                    <div className="flex items-center justify-between p-4 border border-white/10 rounded-[14px] bg-[#1a1d22]">
                      <div className="space-y-0.5">
                        <Label htmlFor="scim" className="text-base">
                          SCIM Provisioning
                        </Label>
                        <p className="text-sm text-white/60">
                          Enable automatic user provisioning via SCIM
                        </p>
                      </div>
                      <Switch
                        id="scim"
                        checked={formData.scimEnabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, scimEnabled: checked })}
                      />
                    </div>

                    {/* Phase 10: Identity Validation */}
                    {formData.clientId && formData.clientSecret && formData.identityProvider && (
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleValidateIdentity}
                          disabled={validating}
                          className="w-full"
                        >
                          {validating ? 'Validating...' : 'Validate Identity Configuration'}
                        </Button>
                        {validationStatus && (
                          <div className={`p-3 rounded-lg text-sm ${
                            validationStatus.valid 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {validationStatus.message}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="sticky bottom-0 z-50 bg-[#111317]/80 backdrop-blur-md border-t border-white/10 px-4 py-3 pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleBack}
              className="w-full sm:w-auto px-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="text-sm text-white/60 hidden sm:block">
              Step 4
            </div>

            <Button
              onClick={handleNext}
              disabled={!isFormValid()}
              className="w-full sm:w-auto px-6"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Next
            </Button>
          </div>
        </div>
      </div>
      </div>
    </OCTGuard>
  );
}
