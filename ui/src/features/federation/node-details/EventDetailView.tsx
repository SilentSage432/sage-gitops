import React from "react";
import { X } from "lucide-react";
import { NodeEvent } from "./useNodeEvents";

interface EventDetailViewProps {
  event: NodeEvent | null;
  onClose: () => void;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({
  event,
  onClose,
}) => {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-purple-300">Event Details</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800/60 rounded transition"
            title="Close"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Type */}
          <div>
            <p className="text-xs text-slate-500 mb-1">Type</p>
            <p
              className={`text-sm font-semibold uppercase ${
                event.type === "critical"
                  ? "text-red-400"
                  : event.type === "warning"
                  ? "text-amber-400"
                  : "text-slate-400"
              }`}
            >
              {event.type}
            </p>
          </div>

          {/* Timestamp */}
          <div>
            <p className="text-xs text-slate-500 mb-1">Timestamp</p>
            <p className="text-sm font-mono text-slate-300">
              {new Date(event.timestamp).toLocaleString()}
            </p>
          </div>

          {/* Message */}
          <div>
            <p className="text-xs text-slate-500 mb-1">Message</p>
            <p className="text-sm text-slate-300 break-words">{event.message}</p>
          </div>

          {/* Metadata */}
          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Metadata</p>
              <div className="p-3 bg-slate-800/60 rounded border border-slate-700">
                <pre className="text-xs text-slate-300 font-mono overflow-x-auto">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

