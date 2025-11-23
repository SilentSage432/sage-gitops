'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { OCTGuard } from '@/components/OCTGuard';

export default function DashboardPage() {
  return (
    <OCTGuard>
      <div className="min-h-screen bg-[#0b0c0f] text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-semibold mb-8 text-[#e2e6ee]">
            Dashboard
          </h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Welcome</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/60">
                Dashboard coming soon. This is a placeholder page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </OCTGuard>
  );
}
