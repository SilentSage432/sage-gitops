import React, { useCallback, useState } from 'react';

interface WhispererInputProps {
  onSend: (content: string) => void;
}

export const WhispererInput: React.FC<WhispererInputProps> = ({ onSend }) => {
  const [value, setValue] = useState('');

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

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

  return (
    <div className="whisperer-input flex items-end gap-3">
      <textarea
        className="flex-1 resize-none rounded-xl bg-black/50 border border-purple-500/40 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/40 outline-none p-3 text-sm text-slate-100 placeholder:text-slate-500 transition"
        rows={2}
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


