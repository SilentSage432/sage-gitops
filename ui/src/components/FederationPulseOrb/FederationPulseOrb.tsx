import React from "react";
import { useHeartbeat } from "../../sage/hooks/useHeartbeat";
import "./FederationPulseOrb.css";

export function FederationPulseOrb() {
  const pulse = useHeartbeat();

  const size = 18 + pulse.intensity * 22;
  const glow = pulse.intensity * 25;

  return (
    <div
      className="pulse-orb"
      style={{
        width: size,
        height: size,
        backgroundColor: `hsl(${pulse.hue}, 80%, 60%)`,
        boxShadow: `0 0 ${glow}px hsl(${pulse.hue}, 80%, 55%)`,
        animationDuration: `${1 / pulse.rate}s`,
      }}
    />
  );
}

