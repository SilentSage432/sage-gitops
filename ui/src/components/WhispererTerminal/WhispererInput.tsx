import React, { useCallback, useEffect, useRef, useState } from 'react';
import { pushThought } from "../../sage/cognition/ThoughtChain";
import { operatorCognitiveSync } from "../../systems/operatorCognitiveSync";

interface WhispererInputProps {
  onSend: (content: string) => void;
}

export const WhispererInput: React.FC<WhispererInputProps> = ({ onSend }) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = 'auto';
    const computed = typeof window !== 'undefined' ? window.getComputedStyle(textarea) : null;
    const lineHeight = computed ? parseFloat(computed.lineHeight || '20') : 20;
    const maxHeight = lineHeight * 4;
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    // Phase 45: Record operator input event for cognitive sync
    operatorCognitiveSync.recordInputEvent();

    pushThought({
      id: crypto.randomUUID(),
      from: "operator",
      text: trimmed,
      tags: ["command"],
      timestamp: Date.now(),
    });

    onSend(trimmed);
    setValue('');
  }, [onSend, value]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  return (
    <div className="whisperer-input flex items-end gap-3">
      <textarea
        ref={textareaRef}
        className="whisperer-input-area flex-1 resize-none rounded-xl border bg-[#050506] p-3 text-sm text-slate-100 placeholder:text-slate-500 transition"
        rows={1}
        placeholder="Transmit to the Mesh… (Shift+Enter for newline)"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        type="button"
        onClick={handleSend}
        className="whisperer-send-btn px-5 py-2 rounded-xl font-semibold text-sm tracking-wide uppercase"
      >
        Send
      </button>
    </div>
  );
};


