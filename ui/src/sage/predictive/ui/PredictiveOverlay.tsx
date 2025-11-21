import React, { useEffect, useState } from "react";

export const PredictiveOverlay: React.FC = () => {
  const [signal, setSignal] = useState<any>(null);

  useEffect(() => {
    function handler(e: any) {
      setSignal(e.detail);
    }
    window.addEventListener("SAGE_PREDICTIVE_SIGNAL", handler);
    return () => window.removeEventListener("SAGE_PREDICTIVE_SIGNAL", handler);
  }, []);

  if (!signal) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        padding: "10px 16px",
        background: "rgba(109, 51, 255, 0.15)",
        border: "1px solid rgba(149, 116, 255, 0.4)",
        borderRadius: "8px",
        color: "#d8cfff",
        fontSize: 14,
        backdropFilter: "blur(6px)",
      }}
    >
      <div>
        <strong>Prediction:</strong> {signal.intent.label}
      </div>
      <div style={{ fontSize: 12, opacity: 0.6 }}>
        confidence: {(signal.confidence * 100).toFixed(1)}%
      </div>
    </div>
  );
};

