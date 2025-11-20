import React, { useEffect, useState } from "react";
import { usePulseStore } from "../../sage/state/pulseStore";
import { useFederationSignals } from "../../sage/hooks/useFederationSignals";

export const WhispererTerminal: React.FC = () => {
  const [lines, setLines] = useState<string[]>([]);
  const pulses = usePulseStore((s) => s.pulses);

  useFederationSignals();

  useEffect(() => {
    if (!pulses.length) return;

    const last = pulses[pulses.length - 1];
    setLines((prev) => [
      ...prev,
      `[${last.signal}] from ${last.source}`,
    ]);
  }, [pulses]);

  return (
    <div className="p-4 overflow-y-auto font-mono text-sm text-purple-200">
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
};
