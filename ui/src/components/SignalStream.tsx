import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { SignalMessage } from "../lib/stream/transformers";

interface SignalStreamProps {
  signals: SignalMessage[];
}

export const SignalStream: React.FC<SignalStreamProps> = ({ signals }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  // Auto-scroll to bottom when new entries arrive (only if user hasn't scrolled up)
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      userScrolledRef.current = !isNearBottom;
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  useEffect(() => {
    if (containerRef.current && !userScrolledRef.current) {
      setTimeout(() => {
        if (containerRef.current && !userScrolledRef.current) {
          containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 50);
    }
  }, [signals]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto p-4 font-mono text-sm"
      style={{ scrollbarWidth: "thin" }}
    >
      {signals.length === 0 ? (
        <div className="text-slate-500 text-center py-8">
          No signal intelligence available
        </div>
      ) : (
        signals.map((signal) => (
          <motion.div
            key={signal.id}
            className={`mb-2 p-2 rounded-lg border-l-2 ${
              signal.isSignificant
                ? "bg-slate-900/50 border-purple-500"
                : "bg-slate-900/30 border-slate-700"
            }`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">{signal.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs ${signal.color} font-semibold`}>
                    {signal.signal}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatTime(signal.timestamp)}
                  </span>
                  {signal.isSignificant && (
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                      SIGNIFICANT
                    </span>
                  )}
                </div>
                <div className={`${signal.color} text-sm`}>
                  {signal.message}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {signal.source}
                </div>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
};

