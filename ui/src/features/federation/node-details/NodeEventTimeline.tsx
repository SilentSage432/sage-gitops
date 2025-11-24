import React, { useEffect, useRef, useState } from "react";
import { NodeEvent } from "./useNodeEvents";

interface NodeEventTimelineProps {
  events: NodeEvent[];
  onSelectEvent?: (event: NodeEvent) => void;
}

export const NodeEventTimeline: React.FC<NodeEventTimelineProps> = ({
  events,
  onSelectEvent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const wasAtBottomRef = useRef<boolean>(true);

  // Check if user is near bottom (within 100px)
  const isNearBottom = (element: HTMLElement): boolean => {
    const threshold = 100;
    return (
      element.scrollHeight - element.scrollTop - element.clientHeight < threshold
    );
  };

  // Handle scroll events to detect user scrolling
  const handleScroll = () => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const currentScrollTop = container.scrollTop;

    // Check if user scrolled up (manually)
    if (currentScrollTop < lastScrollTopRef.current) {
      wasAtBottomRef.current = false;
      setIsUserScrolling(true);

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }

      // Reset user scrolling flag after 2 seconds of no scrolling
      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsUserScrolling(false);
        wasAtBottomRef.current = isNearBottom(container);
      }, 2000);
    } else {
      // User scrolled down - check if they're at bottom
      wasAtBottomRef.current = isNearBottom(container);
      if (wasAtBottomRef.current) {
        setIsUserScrolling(false);
      }
    }

    lastScrollTopRef.current = currentScrollTop;
  };

  // Auto-scroll to bottom when new events arrive (only if user hasn't scrolled up)
  useEffect(() => {
    if (!containerRef.current || isUserScrolling || !wasAtBottomRef.current) {
      return;
    }

    // Small delay to ensure DOM is updated
    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
        wasAtBottomRef.current = true;
      }
    });
  }, [events.length, isUserScrolling]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Initial scroll to bottom
  useEffect(() => {
    if (containerRef.current && events.length > 0) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      wasAtBottomRef.current = true;
    }
  }, []);

  if (events.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <p className="text-slate-500 text-sm">No events recorded yet</p>
      </div>
    );
  }

  const getEventColor = (type: NodeEvent["type"]) => {
    switch (type) {
      case "info":
        return "text-slate-500 border-slate-700";
      case "warning":
        return "text-amber-400 border-amber-500/50 animate-pulse";
      case "critical":
        return "text-red-500 border-red-500 animate-pulse";
      default:
        return "text-slate-500 border-slate-700";
    }
  };

  const getEventDotColor = (type: NodeEvent["type"]) => {
    switch (type) {
      case "info":
        return "bg-slate-500";
      case "warning":
        return "bg-amber-400";
      case "critical":
        return "bg-red-500";
      default:
        return "bg-slate-500";
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto pr-2 space-y-3"
    >
      {events.map((event) => (
        <button
          key={event.id}
          onClick={() => onSelectEvent?.(event)}
          className={`w-full text-left p-3 rounded border-l-4 ${getEventColor(
            event.type
          )} bg-slate-900/60 hover:bg-slate-800/60 transition group`}
        >
          <div className="flex items-start gap-3">
            {/* Timeline dot */}
            <div
              className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getEventDotColor(
                event.type
              )}`}
            />

            {/* Event content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs font-mono text-slate-400">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </p>
                <span
                  className={`text-xs font-semibold uppercase ${
                    event.type === "critical"
                      ? "text-red-400"
                      : event.type === "warning"
                      ? "text-amber-400"
                      : "text-slate-400"
                  }`}
                >
                  {event.type}
                </span>
              </div>
              <p className="text-sm break-words">{event.message}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

