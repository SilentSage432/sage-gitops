'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup } from '@/components/ui/radio-group';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

type Step = 1 | 2 | 3;

interface PersonalData {
  fullName: string;
  email: string;
  callsign: string;
  intent: string;
}

export default function PersonalOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<PersonalData>({
    fullName: '',
    email: '',
    callsign: '',
    intent: '',
  });
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({});

  const validateStep1 = (): boolean => {
    const newErrors: { fullName?: string; email?: string } = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      if (formData.intent) {
        setStep(3);
      }
    }
  };

  const handleBack = () => {
    if (step === 1) {
      router.push('/onboarding/select');
    } else {
      setStep((step - 1) as Step);
    }
  };

  const handleSubmit = () => {
    // Store completion flag
    localStorage.setItem('personalOnboardingComplete', 'true');
    localStorage.setItem('personalOnboardingData', JSON.stringify(formData));
    
    // Redirect to personal dashboard
    router.push('/dashboard/personal');
  };

  const intentOptions = [
    { value: 'learn', label: 'Learn & Explore' },
    { value: 'operator', label: 'Become an Operator' },
    { value: 'federation', label: 'Future Federation Member' },
  ];

  return (
      <div className="min-h-[100svh] flex flex-col bg-[#0b0c0f] text-white">
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overscroll-behavior-contain pt-safe pb-safe px-4 py-6 flex items-center justify-center">
          <div className="max-w-3xl w-full space-y-8 fade-in">
          <div>
            <Card className="rounded-3xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl font-medium">
                  {step > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBack}
                      className="mr-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  )}
                  Personal Onboarding
                </CardTitle>
                <div className="text-sm text-white/60">
                  Step {step} of 3
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Step 1: Identity */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-medium text-[#e2e6ee]">Identity</h2>
                    <p className="text-sm text-white/60 mt-2">
                      Tell us about yourself
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName" className="text-white/80">
                        Full Name <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Enter your full name"
                        className={errors.fullName ? 'border-red-500' : ''}
                      />
                      {errors.fullName && (
                        <p className="text-sm text-red-400 mt-1">{errors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-white/80">
                        Email <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your.email@example.com"
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-400 mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="callsign" className="text-white/80">
                        Callsign / Username <span className="text-white/40 text-xs">(optional)</span>
                      </Label>
                      <Input
                        id="callsign"
                        type="text"
                        value={formData.callsign}
                        onChange={(e) => setFormData({ ...formData, callsign: e.target.value })}
                        placeholder="Choose a callsign"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Intent Selection */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-medium text-[#e2e6ee]">Intent</h2>
                    <p className="text-sm text-white/60 mt-2">
                      What brings you to SAGE?
                    </p>
                  </div>

                  <RadioGroup
                    options={intentOptions}
                    value={formData.intent}
                    onValueChange={(value) => setFormData({ ...formData, intent: value })}
                  />
                </div>
              )}

              {/* Step 3: Confirmation */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-[#10b981]/20 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-[#10b981]" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-medium text-[#e2e6ee] text-center">
                      Review Your Information
                    </h2>
                  </div>

                  <div className="space-y-4 p-4 bg-[#1a1d22] rounded-[14px] border border-white/10">
                    <div>
                      <p className="text-sm text-white/60">Full Name</p>
                      <p className="text-sm font-medium text-[#e2e6ee]">{formData.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/60">Email</p>
                      <p className="text-sm font-medium text-[#e2e6ee]">{formData.email}</p>
                    </div>
                    {formData.callsign && (
                      <div>
                        <p className="text-sm text-white/60">Callsign</p>
                        <p className="text-sm font-medium text-[#e2e6ee]">{formData.callsign}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-white/60">Intent</p>
                      <p className="text-sm font-medium text-[#e2e6ee]">
                        {intentOptions.find(opt => opt.value === formData.intent)?.label}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {step === 1 ? 'Cancel' : 'Back'}
                </Button>
                {step < 3 ? (
                  <Button
                    onClick={handleNext}
                    disabled={step === 2 && !formData.intent}
                    className="w-full sm:w-auto"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    className="w-full sm:w-auto"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Activate Access
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
