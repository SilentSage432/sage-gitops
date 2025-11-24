"use client";

import { OperatorTerminal } from "@/components/OperatorTerminal";
import { OperatorInput } from "@/components/OperatorInput";

export default function OperatorTerminalPage() {
  return (
    <div className="min-h-screen bg-[#0b0c0f] text-white relative">
      {/* Main Terminal Content */}
      <div className="animate-in fade-in duration-300 ease-out pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            {/* Operator Terminal */}
            <div>
              <OperatorTerminal />
            </div>
          </div>
        </div>
      </div>

      {/* Command Input Bar - Fixed at bottom */}
      <OperatorInput />
    </div>
  );
}
