"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send } from "lucide-react";

interface OperatorInputProps {
  onSend?: (command: string) => void;
}

export function OperatorInput({ onSend }: OperatorInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCommand = useCallback(
    async (command: string) => {
      const cmd = command.trim();
      if (!cmd) return;

      // Use window command log if available (for federation routing)
      const commandLog = (window as any).__federationCommandLog;
      if (commandLog && commandLog.handleCommand) {
        await commandLog.handleCommand(cmd);
      } else if (onSend) {
        onSend(cmd);
      }
    },
    [onSend]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (input.trim()) {
        handleCommand(input);
        setInput("");
      }
    },
    [input, handleCommand]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#111317] border-t border-white/10 p-4 z-40">
      <div className="max-w-5xl mx-auto">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command... (Shift+Enter for newline)"
            className="flex-1 font-mono text-sm"
          />
          <Button type="submit" variant="default" size="default">
            <Send className="w-4 h-4 mr-2" />
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}

