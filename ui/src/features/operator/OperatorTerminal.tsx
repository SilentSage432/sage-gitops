import React, { useState, useRef, useEffect } from "react";
import { parseIntentWithContext } from "../../lib/intentEngine";
import { createInitialMemory } from "../../lib/contextEngine";

interface OperatorTerminalProps {
  onNavigate?: (target: string) => void;
}

export const OperatorTerminal: React.FC<OperatorTerminalProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<
    { from: "operator" | "sage"; text: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [memory, setMemory] = useState(createInitialMemory());
  const logEndRef = useRef<HTMLDivElement | null>(null);

  const pushMessage = (from: "operator" | "sage", text: string) => {
    setMessages((prev) => [...prev, { from, text }]);
    setMemory((m) => ({
      ...m,
      lastMessages: [...m.lastMessages.slice(-2), text]
    }));
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    pushMessage("operator", input);

    // Parse with context + memory
    const intent = parseIntentWithContext(input, memory);

    // Save last intent
    setMemory((m) => ({ ...m, lastIntent: intent }));

    // === Handle intent ===
    switch (intent.type) {
      case "ui":
        if (intent.action === "open-panel" && intent.target) {
          onNavigate?.(intent.target);
          pushMessage("sage", `Opening ${intent.target}…`);
          setMemory((m) => ({ ...m, lastPanel: intent.target }));
        }
        break;

      case "system":
        if (intent.action === "system-status") {
          pushMessage("sage", "Federation status nominal. All nodes online.");
          setMemory((m) => ({ ...m, lastAction: "system-status" }));
        }
        break;

      case "rho2":
        pushMessage("sage", "Engaging Rho² epoch sequence…");
        setMemory((m) => ({ ...m, lastAction: "rho2-rotation" }));
        break;

      case "unknown":
      default:
        pushMessage(
          "sage",
          "Acknowledged. No direct mapping yet — learning this pattern."
        );
    }

    setInput("");
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-black/40">
      <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.from === "operator"
                ? "text-purple-300"
                : "text-indigo-200"
            }
          >
            <strong>{m.from === "operator" ? "You" : "SAGE"}:</strong> {m.text}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      <div className="border-t border-slate-700 p-3 flex space-x-2">
        <input
          className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none"
          placeholder="Issue command…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white text-sm rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
};

