import React, { useCallback, useState } from "react";
import { useWhispererStream } from "./hooks/useWhispererStream";
import { sendWhispererCommand } from "./hooks/useWhispererSend";

interface TerminalMessage {
  type: string;
  content: string;
  timestamp: number;
}

export const WhispererTerminal: React.FC = () => {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [input, setInput] = useState("");

  const addMessage = useCallback((msg: TerminalMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  useWhispererStream(addMessage);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    addMessage({
      type: "operator",
      content: trimmed,
      timestamp: Date.now(),
    });
    sendWhispererCommand(trimmed);
    setInput("");
  }, [addMessage, input]);

  return (
    <div className="flex flex-col h-full bg-black/30 backdrop-blur-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-2 text-sage-green font-mono">
        {messages.map((m, index) => (
          <div key={`${m.timestamp}-${index}`} className="whitespace-pre-wrap">
            <span className="opacity-60">[{new Date(m.timestamp).toLocaleTimeString()}]</span>{" "}
            <span className={m.type === "operator" ? "text-blue-300" : "text-purple-300"}>
              {m.type.toUpperCase()}:
            </span>{" "}
            {m.content}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-slate-800 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
          className="flex-1 bg-black/40 text-slate-200 px-3 py-2 rounded border border-slate-700"
          placeholder="Send command to Whisperer..."
        />
        <button
          type="button"
          onClick={handleSend}
          className="px-4 py-2 bg-indigo-600 text-white rounded border border-indigo-500 text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
};
