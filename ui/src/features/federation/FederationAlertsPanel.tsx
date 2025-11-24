import React from "react";
import { useFederationAlerts } from "../../core/useFederationAlerts";

export const FederationAlertsPanel = () => {
  const alerts = useFederationAlerts();

  return (
    <div className="h-full flex flex-col overflow-hidden w-full">
      {/* HEADER */}
      <div className="p-6 border-b border-slate-800 flex-shrink-0">
        <h2 className="text-2xl font-bold tracking-wide text-purple-300 mb-2">
          Federation Alerts
        </h2>
        <p className="text-sm text-slate-400">
          Real-time federation alert stream
        </p>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="p-6 space-y-4 min-w-0">
          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">No alerts yet...</p>
              <p className="text-slate-600 text-xs mt-2">Alerts will appear here when detected</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded border border-slate-700 bg-slate-900/60 shadow-md min-w-0 overflow-hidden"
                >
                  <div className="text-xs text-slate-500 mb-1">
                    {new Date(a.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="font-semibold text-purple-200 mb-1 truncate">
                    {a.severity}
                  </div>
                  <div className="text-slate-300 text-sm break-words">
                    {a.message}
                  </div>
                  {(a.nodeId || a.arc) && (
                    <div className="text-xs text-slate-500 mt-2 truncate">
                      {a.nodeId && <span>{a.nodeId}</span>}
                      {a.nodeId && a.arc && <span> • </span>}
                      {a.arc && <span>{a.arc}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

