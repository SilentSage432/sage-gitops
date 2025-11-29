import React from "react";
import { IntentApproval } from "../lib/api/intent";

interface ApprovalPanelProps {
  intents?: IntentApproval[];
}

export function ApprovalPanel({ intents }: ApprovalPanelProps) {
  if (!intents?.length) {
    return <div className="text-gray-400">No pending intents.</div>;
  }

  return (
    <div className="p-4 border border-yellow-600 rounded bg-black text-yellow-400">
      <h3 className="font-bold mb-3">Pending Intent Approval</h3>
      {intents.map((intent) => (
        <div key={intent.id} className="mb-2 p-2 border border-gray-700">
          <div>Action: {intent.action}</div>
          <div>From: {intent.requested_by}</div>
          <div>Status: {intent.status}</div>
        </div>
      ))}
    </div>
  );
}

