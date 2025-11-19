import React, { useEffect, useState } from "react";
import { initStream } from "@/services/stream";

export const WhispererTerminal: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    initStream((msg: string) => {
      setMessages((prev) => [...prev, msg]);
    });
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 text-slate-200 font-mono text-sm">
      <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className="text-slate-300 whitespace-pre-wrap">
            {m}
          </div>
        ))}
      </div>
    </div>
  );
};
