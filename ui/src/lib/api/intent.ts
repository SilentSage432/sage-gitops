export interface IntentApproval {
  id: string;
  requested_by: string;
  timestamp: number;
  action: string;
  status: "pending" | "approved" | "denied";
  metadata?: Record<string, any>;
}

export async function fetchPendingIntents(): Promise<IntentApproval[]> {
  const res = await fetch("/api/intent/pending");
  return res.json();
}

