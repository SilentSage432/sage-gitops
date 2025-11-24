import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNodeSignalStream } from "@/hooks/useNodeSignalStream";
import { useNodeEvents, NodeEvent } from "./node-details/useNodeEvents";
import { NodeEventTimeline } from "./node-details/NodeEventTimeline";
import { EventDetailView } from "./node-details/EventDetailView";

interface NodeDetailsPanelProps {
  nodeId: string;
  onBack?: () => void;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({ nodeId, onBack }) => {
  const metrics = useNodeSignalStream(nodeId);
  const events = useNodeEvents(nodeId);
  const [selectedEvent, setSelectedEvent] = useState<NodeEvent | null>(null);

  return (
    <div className="h-full flex flex-col overflow-hidden w-full">
      {/* HEADER */}
      <div className="p-6 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-800/60 rounded transition flex items-center justify-center"
              title="Back to Pi Kluster"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
          )}
          <h2 className="text-2xl font-bold tracking-wide text-purple-300">
            Node: {nodeId}
          </h2>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="p-6 space-y-6 min-w-0">

          {metrics ? (
            <>
              <div className="grid grid-cols-2 gap-4 min-w-0">

                <div className="p-4 bg-slate-900/60 rounded border border-slate-800 min-w-0 overflow-hidden">
                  <p className="text-xs text-slate-500 mb-1 truncate">Status</p>
                  <p className={`font-mono text-lg truncate ${
                    metrics.status === "ONLINE" ? "text-green-400" : 
                    metrics.status === "DEGRADED" ? "text-yellow-400" : 
                    "text-red-400"
                  }`}>
                    {metrics.status}
                  </p>
                </div>

                <div className="p-4 bg-slate-900/60 rounded border border-slate-800 min-w-0 overflow-hidden">
                  <p className="text-xs text-slate-500 mb-1 truncate">Uptime</p>
                  <p className="text-slate-300 font-mono text-lg truncate">00:00:00</p>
                </div>

                <div className="p-4 bg-slate-900/60 rounded border border-slate-800 min-w-0 overflow-hidden">
                  <p className="text-xs text-slate-500 mb-1 truncate">CPU Load</p>
                  <p className="text-yellow-300 font-mono text-lg truncate">{metrics.cpu}</p>
                </div>

                <div className="p-4 bg-slate-900/60 rounded border border-slate-800 min-w-0 overflow-hidden">
                  <p className="text-xs text-slate-500 mb-1 truncate">Memory</p>
                  <p className="text-blue-300 font-mono text-lg truncate">{metrics.memory}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded border border-slate-800 min-w-0 overflow-hidden">
                <p className="text-xs text-slate-500 mb-2 truncate">Last Heartbeat</p>
                <p className="text-purple-300 font-mono truncate">{metrics.heartbeat}</p>
              </div>
            </>
          ) : (
            <div className="p-4 bg-slate-900/60 rounded border border-slate-800 min-w-0 overflow-hidden">
              <p className="text-xs text-slate-500 mb-2 truncate">Status</p>
              <p className="text-slate-500 font-mono text-sm">awaiting signal…</p>
            </div>
          )}

          {/* Event Timeline */}
          <div className="bg-slate-900/60 rounded border border-slate-800 min-w-0 overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 border-b border-slate-800 flex-shrink-0">
              <p className="text-xs text-slate-500 mb-1">Event Timeline</p>
              <p className="text-sm text-slate-400">
                {events.length} {events.length === 1 ? "event" : "events"} recorded
              </p>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <NodeEventTimeline
                events={events}
                onSelectEvent={(event) => setSelectedEvent(event)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailView
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>

  );

};

