import React, { useState, useRef, useEffect } from "react";
import { parseIntentWithContext } from "../../lib/intentEngine";
import { createInitialMemory } from "../../lib/contextEngine";
import "./OperatorTerminal.css";

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
    <div className="terminal-wrapper">
      {/* Scrollable log area */}
      <div className="terminal-log">
        {messages.map((m, i) => (
          <div key={i} className={`terminal-line ${m.from === "operator" ? "terminal-line-operator" : "terminal-line-sage"}`}>
            <strong>{m.from === "operator" ? "You" : "SAGE"}:</strong> {m.text}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* Fixed input bar */}
      <div className="terminal-input-bar">
        <input
          className="terminal-input"
          value={input}
          placeholder="Issue command..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="terminal-send" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

