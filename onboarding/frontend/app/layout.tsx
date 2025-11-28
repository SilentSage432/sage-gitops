import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FederationHandshake } from "@/components/FederationHandshake";
import OperatorIdentityLamp from "@/components/OperatorIdentityLamp";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SAGE Onboarding",
  description: "SAGE Onboarding System - Hardware Authentication Required",
  viewport: {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#0b0c0f] text-white safe-container`}
      >
        {/* Phase 17.5: Operator Identity Status Indicator */}
        <div className="flex justify-end p-4">
          <OperatorIdentityLamp />
        </div>
        <FederationHandshake />
        {children}
      </body>
    </html>
  );
}
