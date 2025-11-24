'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
      <div className="min-h-screen bg-[#0b0c0f] text-white pb-24">
        <div className="max-w-3xl mx-auto py-10 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
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
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
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
                  </motion.div>
                )}

                {/* SSO Fields */}
                {formData.authMethod === 'sso' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="identityProvider">Identity Provider</Label>
                      <Select
                        id="identityProvider"
                        value={formData.identityProvider}
                        onChange={(e) => setFormData({ ...formData, identityProvider: e.target.value })}
                      >
                        <SelectOption value="">Select identity provider</SelectOption>
                        {identityProviderOptions.map((provider) => (
                          <SelectOption key={provider} value={provider}>
                            {provider}
                          </SelectOption>
                        ))}
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
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#111317] border-t border-white/10 p-4">
          <div className="max-w-xl mx-auto px-4 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              className="px-6"
            >
              &lt; Back
            </Button>
            
            <div className="text-sm text-white/60">
              Step 4
            </div>

            <Button
              onClick={handleNext}
              disabled={!isFormValid()}
              className="px-6"
            >
              Next &gt;
            </Button>
          </div>
        </div>
      </div>
    </OCTGuard>
  );
}
