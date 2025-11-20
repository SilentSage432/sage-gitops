import React from "react";

import { TelemetryCategory } from "../../sage/telemetry/TelemetryTypes";

const categories: TelemetryCategory[] = [
  "ALL",
  "SYSTEM",
  "ARC",
  "RHO2",
  "FEDERATION",
  "AGENT",
  "WHISPERER",
  "ERROR",
  "DEBUG",
  "HEARTBEAT",
];

export function FilterBar({
  active,
  onSelect,
}: {
  active: TelemetryCategory;
  onSelect: (c: TelemetryCategory) => void;
}) {
  return (
    <div className="filter-bar">
      {categories.map((c) => (
        <button
          key={c}
          className={`filter-btn ${active === c ? "active" : ""}`}
          onClick={() => onSelect(c)}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

