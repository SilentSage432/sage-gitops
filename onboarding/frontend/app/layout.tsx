'use client';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import OperatorIdentityLamp from "@/components/OperatorIdentityLamp";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

interface AuthStatus {
  registered: boolean;
  authenticated: boolean;
  operator: string;
}

/**
 * SINGLE SOURCE OF TRUTH for routing.
 * Fetches operator registration + authentication exactly once.
 * Routes based on:
 * - registered && authenticated -> /dashboard
 * - registered && !authenticated -> /auth
 * - !registered -> /register
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchAuthStatus() {
      if (!isMounted) {
        return;
      }

      const res = await fetch("/api/auth/status", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!isMounted) {
        return;
      }

      if (!res.ok) {
        // On error, assume not registered
        const errorStatus: AuthStatus = {
          registered: false,
          authenticated: false,
          operator: 'prime',
        };
        setAuthStatus(errorStatus);
        // Route to /register on error
        if (pathname !== '/register') {
          router.replace('/register');
        }
        return;
      }

      const data = await res.json();

      if (!isMounted) {
        return;
      }

      const status: AuthStatus = {
        registered: data.registered === true,
        authenticated: data.authenticated === true,
        operator: data.operator || 'prime',
      };

      setAuthStatus(status);

      // SINGLE SOURCE OF TRUTH: Route based on auth status
      // Only route if we're on the wrong path to prevent loops
      if (status.registered === false) {
        // Not registered -> /register
        if (pathname !== '/register') {
          router.replace('/register');
        }
      } else if (status.registered === true && status.authenticated === false) {
        // Registered but not authenticated -> /auth
        if (pathname !== '/auth') {
          router.replace('/auth');
        }
      } else if (status.registered === true && status.authenticated === true) {
        // If authenticated, allow onboarding routes, operator terminal, or dashboard
        const allowed =
          pathname.startsWith('/onboarding') ||
          pathname === '/operator/terminal' ||
          pathname === '/dashboard';

        if (!allowed) {
          router.replace('/onboarding/select');
        }
      }
    }

    // Fetch auth status ONCE on mount
    fetchAuthStatus();

    // Listen for auth status changes (after registration/authentication)
    const handleAuthChange = () => {
      fetchAuthStatus();
    };

    window.addEventListener('auth-status-changed', handleAuthChange);

    return () => {
      isMounted = false;
      window.removeEventListener('auth-status-changed', handleAuthChange);
    };
  }, [router, pathname]);

  // Determine which "canonical" route should be active based on auth status.
  // This is used for guarding render during transitions, but onboarding routes
  // remain valid destinations after authentication.
  const getExpectedRoute = () => {
    if (!authStatus) return null;

    // Not registered
    if (!authStatus.registered) return '/register';

    // Registered but not authenticated
    if (!authStatus.authenticated) return '/auth';

    // Registered + authenticated canonical route
    return '/dashboard';
  };

  const expectedRoute = getExpectedRoute();

  const isAuthenticated =
    authStatus?.registered === true && authStatus?.authenticated === true;

  const isAllowedOnboardingRoute =
    pathname.startsWith('/onboarding') ||
    pathname === '/operator/terminal' ||
    pathname === '/dashboard';

  // While checking auth status or if expected route can't be determined, show nothing
  if (authStatus === null || !expectedRoute) {
    return (
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#0b0c0f] text-white safe-container`}
        >
          {/* Empty while routing */}
        </body>
      </html>
    );
  }

  const isOnCorrectRoute =
    // Original single-source-of-truth match:
    pathname === expectedRoute ||
    // FIX: when authenticated, allow onboarding, operator terminal, and dashboard paths
    (isAuthenticated && isAllowedOnboardingRoute);

  // Only render children when we're on an allowed/expected route.
  // This keeps router.replace() behavior intact while allowing onboarding
  // flows to render after authentication.
  if (!isOnCorrectRoute) {
    return (
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#0b0c0f] text-white safe-container`}
        >
          {/* Empty while routing to the expected route */}
        </body>
      </html>
    );
  }

  // Render children only when on an allowed route
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#0b0c0f] text-white safe-container`}
      >
        {/* Phase 17.5: Operator Identity Status Indicator */}
        <div className="flex justify-end p-4">
          <OperatorIdentityLamp />
        </div>
        {children}
      </body>
    </html>
  );
}
