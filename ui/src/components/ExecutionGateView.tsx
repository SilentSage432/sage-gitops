import React from "react";

interface ExecutionGateViewProps {
  gate?: {
    action: string;
    allowed: boolean;
    operator?: {
      id?: string;
      mfa?: boolean;
      role?: string;
      timestamp?: number;
      [key: string]: any;
    } | null;
    policy?: {
      action: string;
      allowedRoles: string[];
      allowedTenants: string[];
      forbiddenAgents: string[];
      requirements: string[];
    };
    reasons: string[];
    requirements?: {
      identity: {
        required: boolean;
        satisfied: boolean;
        reason: string;
      };
      mfa?: {
        required: boolean;
        satisfied: boolean;
        reason: string;
      };
      policy?: {
        required: boolean;
        satisfied: boolean;
        reason: string;
      };
      approval: {
        required: boolean;
        satisfied: boolean;
        reason: string;
      };
      riskBoundary: {
        required: boolean;
        satisfied: boolean;
        reason: string;
      };
      policyMatch: {
        required: boolean;
        satisfied: boolean;
        reason: string;
      };
      authority: {
        required: boolean;
        satisfied: boolean;
        reason: string;
      };
    };
    clearance: string;
    note?: string;
    timestamp: number;
  };
}

export function ExecutionGateView({ gate }: ExecutionGateViewProps) {
  if (!gate) return null;

  return (
    <div className="p-4 border border-teal-600 bg-black text-teal-400 rounded">
      <h3 className="font-bold mb-2">Execution Gate Status</h3>
      {!gate.allowed && !gate.operator && (
        <div className="mb-2 text-red-400 text-sm">
          Execution blocked: no authenticated operator
        </div>
      )}
      {gate.operator && !gate.operator.mfa && (
        <div className="mb-2 text-yellow-400 text-sm">
          Execution blocked: MFA/YubiKey not verified
        </div>
      )}
      {gate.operator && gate.operator.mfa && !gate.allowed && (
        <div className="mb-2 text-yellow-400 text-sm">
          Identity + MFA active, but execution still disabled
        </div>
      )}
      {gate.operator && gate.operator.mfa && gate.requirements?.policy && !gate.requirements.policy.satisfied && (
        <div className="mb-2 text-yellow-400 text-sm">
          Execution blocked: policy does not allow this action
        </div>
      )}
      {gate.policy && (
        <div className="mb-2 text-sm">
          <div className="text-cyan-400 font-semibold mb-1">Policy:</div>
          <pre className="text-xs text-cyan-300">{JSON.stringify(gate.policy, null, 2)}</pre>
        </div>
      )}
      <pre className="text-xs">{JSON.stringify(gate, null, 2)}</pre>
    </div>
  );
}

