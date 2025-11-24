import React from "react";

import { TelemetryCategory } from "../../sage/telemetry/TelemetryTypes";
import { Badge } from "@/components/ui/badge";

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
        <Badge
          key={c}
          variant={active === c ? "default" : "outline"}
          className={`filter-btn cursor-pointer ${active === c ? "active" : ""}`}
          onClick={() => onSelect(c)}
        >
          {c}
        </Badge>
      ))}
    </div>
  );
}

