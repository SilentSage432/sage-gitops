// Phase 17.3: Operator Identity Status (Read-Only UI)
// Phase 74: Extended with hardware verification display
// Displays operator identity status from federation state
// No authentication, no verification, no enforcement - just reflection
import { useEffect, useState } from "react";
import { fetchFederationState, type FederationStateResponse } from "@/lib/api/federation";

export default function OperatorIdentityLamp() {
  const [operator, setOperator] = useState<FederationStateResponse["operator"]>(null);
  const [hardwareVerified, setHardwareVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refresh = async () => {
      try {
        const data = await fetchFederationState();
        setOperator(data.operator);
      } catch (err) {
        console.error("Failed to fetch operator identity:", err);
        setOperator(null);
      } finally {
        setLoading(false);
      }
    };

    refresh();
    const interval = setInterval(refresh, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-xs text-slate-500">
        Operator: <span className="text-slate-400">checking...</span>
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="text-xs">
        <span className="text-slate-400">Operator:</span>{" "}
        <span className="text-orange-500">not registered</span>
      </div>
    );
  }

  return (
    <div className="text-xs space-y-1">
      <div>
        <span className="text-slate-400">Operator:</span>{" "}
        <span className="text-green-500 font-mono">{operator.id}</span>
        {operator.source && (
          <span className="text-slate-500 ml-1">({operator.source})</span>
        )}
      </div>
      <div className="text-green-400">
        Hardware Identity:{" "}
        {operator.hardwareKey?.id ? (
          <span className="text-green-500 font-mono">{operator.hardwareKey.id}</span>
        ) : (
          <span className="text-orange-500">Not registered</span>
        )}
      </div>
      {operator.hardwareKey?.id && (
        <div className="text-green-400">
          Hardware Verified:{" "}
          {hardwareVerified === null ? (
            <span className="text-slate-500">Not checked</span>
          ) : hardwareVerified ? (
            <span className="text-green-500">Yes</span>
          ) : (
            <span className="text-red-500">No</span>
          )}
        </div>
      )}
    </div>
  );
}

