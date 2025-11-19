import React, { useState, useRef, useEffect } from "react";

export const OperatorTerminal: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { from: "operator" | "sage"; text: string }[]
  >([]);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  const sendMessage = () => {
    if (!input.trim()) return;

    // Append operator message
    setMessages((prev) => [...prev, { from: "operator", text: input }]);

    // Simple placeholder intent engine
    const lower = input.toLowerCase();

    let response = "I heard you, Operator.";
    if (lower.includes("rho")) response = "Rho² systems acknowledged.";
    if (lower.includes("node")) response = "Node map request queued.";
    if (lower.includes("status")) response = "Status check initialized.";

    setMessages((prev) => [...prev, { from: "sage", text: response }]);

    setInput("");
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-black/80 text-slate-200 font-mono border border-slate-800 rounded">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={
              m.from === "operator"
                ? "text-purple-300"
                : "text-cyan-300"
            }
          >
            <span className="opacity-50">[{m.from}]</span> {m.text}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      <div className="p-3 border-t border-slate-800 flex gap-2">
        <input
          className="flex-1 bg-black/60 border border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-purple-400"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Speak, Operator…"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white"
        >
          Send
        </button>
      </div>
    </div>
  );
};

