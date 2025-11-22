import React, { useEffect, useState } from "react";

export function ForecastHUD() {
  const [alert, setAlert] = useState<null | { level: string; pattern: string }>(null);

  useEffect(() => {
    function onForecast(e: CustomEvent) {
      setAlert(e.detail);

      // auto-clear after 6 seconds
      setTimeout(() => setAlert(null), 6000);
    }

    window.addEventListener("SAGE_FORECAST", onForecast as EventListener);
    return () =>
      window.removeEventListener("SAGE_FORECAST", onForecast as EventListener);
  }, []);

  if (!alert) return null;

  return (
    <div className="forecast-hud">
      <div className={`forecast-pill ${alert.level}`}>
        ⚠️ {alert.pattern.replace("-", " ")}
      </div>
    </div>
  );
}

