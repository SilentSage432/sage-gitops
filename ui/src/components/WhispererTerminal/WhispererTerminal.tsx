import React, { useState } from "react";

import { TelemetryCategory } from "../../sage/telemetry/TelemetryTypes";
import { useTelemetryFeed } from "../../sage/telemetry/useTelemetryFeed";
import { FilterBar } from "./FilterBar";
import "./whisperer.css";

export function WhispererTerminal() {
  const [filter, setFilter] = useState<TelemetryCategory>("ALL");
  const events = useTelemetryFeed(filter);

  return (
    <div className="whisperer-frame">
      <FilterBar active={filter} onSelect={setFilter} />

      <div className="whisperer-log">
        {events.map((e, idx) => (
          <div key={idx} className={`log-line log-${e.category.toLowerCase()}`}>
            [{e.category}] {e.message}
          </div>
        ))}
      </div>
    </div>
  );
}
