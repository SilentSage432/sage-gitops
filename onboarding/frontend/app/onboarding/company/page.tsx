'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectOption } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { OCTGuard } from '@/components/OCTGuard';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CompanyPage() {
  const { company, setCompany } = useOnboardingStore();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: company?.name || '',
    industry: company?.industry || '',
    size: company?.size || '',
    email: company?.email || '',
  });

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
  }>({});

  // Validate form
  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Contact email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid
  const isFormValid = formData.name.trim().length > 0 && 
                      formData.email.trim().length > 0 && 
                      emailRegex.test(formData.email);

  // Validate on change
  useEffect(() => {
    if (formData.name.trim() || formData.email.trim()) {
      validateForm();
    }
  }, [formData.name, formData.email]);

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
      <div className="min-h-screen bg-[#0b0c0f] text-white pb-24">
        <div className="max-w-3xl mx-auto py-10 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
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
          </motion.div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#111317] border-t border-white/10 p-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Button
              variant="outline"
              disabled
              className="px-6"
            >
              &lt; Back
            </Button>
            
            <div className="text-sm text-white/60">
              Step 1
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!isFormValid}
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
