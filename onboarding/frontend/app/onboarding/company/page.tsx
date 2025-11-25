'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectOption } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { OCTGuard } from '@/components/OCTGuard';
import { companySchema } from '@/lib/validation/onboarding-schemas';

export default function CompanyPage() {
  const { company, setCompany } = useOnboardingStore();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: company?.name || '',
    industry: company?.industry || '',
    size: company?.size || '',
    email: company?.email || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  // Validate form with Zod
  const validateForm = () => {
    try {
      const result = companySchema.parse({
        name: formData.name.trim(),
        email: formData.email.trim(),
        industry: formData.industry || undefined,
        size: formData.size || undefined,
      });
      setErrors({});
      setIsValid(true);
      return true;
    } catch (error: any) {
      if (error.errors) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
      }
      setIsValid(false);
      return false;
    }
  };

  // Validate on change
  useEffect(() => {
    if (formData.name.trim() || formData.email.trim()) {
      validateForm();
    }
  }, [formData.name, formData.email, formData.industry, formData.size]);

  const handleSubmit = () => {
    if (validateForm()) {
      setCompany({
        name: formData.name.trim(),
        industry: formData.industry as any || undefined,
        size: formData.size as any || undefined,
        email: formData.email.trim(),
      });
      router.push('/onboarding/data-regions');
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
                Company Profile
              </h2>
              
              <div className="space-y-4">
                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Company Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter company name"
                    className={errors.name ? 'border-red-400' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-400">{errors.name}</p>
                  )}
                </div>

                {/* Industry */}
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  >
                    <SelectOption value="">Select industry</SelectOption>
                    <SelectOption value="Healthcare">Healthcare</SelectOption>
                    <SelectOption value="Finance">Finance</SelectOption>
                    <SelectOption value="Retail">Retail</SelectOption>
                    <SelectOption value="Manufacturing">Manufacturing</SelectOption>
                    <SelectOption value="Other">Other</SelectOption>
                  </Select>
                </div>

                {/* Company Size */}
                <div className="space-y-2">
                  <Label htmlFor="size">Company Size</Label>
                  <Select
                    id="size"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  >
                    <SelectOption value="">Select company size</SelectOption>
                    <SelectOption value="1-10">1-10</SelectOption>
                    <SelectOption value="11-50">11-50</SelectOption>
                    <SelectOption value="51-200">51-200</SelectOption>
                    <SelectOption value="200+">200+</SelectOption>
                  </Select>
                </div>

                {/* Contact Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Contact Email <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter contact email"
                    className={errors.email ? 'border-red-400' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-400">{errors.email}</p>
                  )}
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="sticky bottom-0 z-50 bg-[#111317]/80 backdrop-blur-md border-t border-white/10 px-4 py-3 pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
            <Button
              variant="outline"
              disabled
              className="w-full sm:w-auto px-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="text-sm text-white/60 hidden sm:block">
              Step 1
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              className="w-full sm:w-auto px-6"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Next
            </Button>
          </div>
        </div>
      </div>
    </OCTGuard>
  );
}
