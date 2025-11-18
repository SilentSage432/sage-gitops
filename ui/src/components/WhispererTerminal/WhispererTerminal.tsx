import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildResponse } from './responseEngine';
import { routeCommand } from './commandRouter';
import { MessageEntry, MessageRole } from './messageTypes';
import './styles.css';

const createMessage = (role: MessageRole, body: string): MessageEntry => ({
  id: `${role}-${crypto.randomUUID?.() ?? Date.now()}`,
  role,
  body,
  timestamp: new Date().toISOString(),
});

export const WhispererTerminal: React.FC = () => {
  const [messages, setMessages] = useState<MessageEntry[]>(() => [
    createMessage('system', 'Whisperer Terminal 3.0 initialized. Awaiting operator signal.'),
  ]);
  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [draft, setDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const enqueueMessage = useCallback((message: MessageEntry) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const scrollToLatest = useCallback(() => {
    if (logRef.current) {
      logRef.current.scrollTo({
        top: logRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  const handleSend = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) {
        return;
      }

      const route = routeCommand(trimmed);
      enqueueMessage(createMessage('operator', trimmed));
      setDraft('');

      if (replyTimerRef.current) {
        clearTimeout(replyTimerRef.current);
      }

      setIsThinking(true);
      const { delay, body } = buildResponse(route);

      replyTimerRef.current = window.setTimeout(() => {
        enqueueMessage(createMessage('sage', body));
        setIsThinking(false);
        replyTimerRef.current = null;
      }, delay);
    },
    [enqueueMessage],
  );

  useEffect(() => {
    return () => {
      if (replyTimerRef.current) {
        clearTimeout(replyTimerRef.current);
        setIsThinking(false);
      }
    };
  }, []);

  useEffect(() => {
    scrollToLatest();
  }, [messages, scrollToLatest]);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = 'auto';
    const computed = typeof window !== 'undefined' ? window.getComputedStyle(textarea) : null;
    const lineHeight = computed ? parseFloat(computed.lineHeight || '20') : 20;
    const maxHeight = lineHeight * 4;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [draft, adjustTextareaHeight]);

  const diagnostics = useMemo(
    () => [
      { label: 'Signal', value: 'Aligned' },
      { label: 'Flux', value: `${messages.length} msgs` },
      { label: 'Bridge', value: 'Stable' },
    ],
    [messages.length],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend(draft);
      }
    },
    [draft, handleSend],
  );

  const labelMap: Record<MessageRole, string> = {
    operator: 'OPERATOR >',
    sage: 'SAGE ::',
    system: '[SYSTEM]',
    arc: '[ARC]',
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <section className="whisperer-terminal holo-console flex-1 flex flex-row gap-6 p-6 snap-pinned">
      <div className="flex flex-1 flex-col gap-4 min-w-0">
        <header className="terminal-header flex items-center justify-between rounded-2xl px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Primary Console</p>
            <h2 className="text-2xl font-semibold text-white">Whisperer Terminal</h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Phase 3 · Command Routing</p>
            <p className="text-xs text-slate-500">Enterprise channel · Arc awareness</p>
          </div>
        </header>

        <div className="flex flex-1 flex-col min-h-0 rounded-3xl border border-slate-900/60 bg-[#050506]">
          <div ref={logRef} className="whisperer-log overflow-y-auto flex-1 rounded-3xl">
            {messages.map((entry) => (
              <div key={entry.id} className={`whisperer-line ${entry.role}`}>
                <div className="whisperer-label">{labelMap[entry.role]}</div>
                <div className="whisperer-body">
                  <p className="whisperer-content">{entry.body}</p>
                  <span className="whisperer-timestamp">{formatTimestamp(entry.timestamp)}</span>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="whisperer-line thinking">
                <div className="whisperer-label">SAGE ::</div>
                <div className="whisperer-body">
                  <span className="thinking-glyph" aria-live="polite" aria-label="SAGE processing">
                    ⋯
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="whisperer-input-panel border-t border-slate-900/80">
            <div className="whisperer-input-deck">
              <textarea
                ref={textareaRef}
                rows={1}
                className="whisperer-input-area"
                placeholder="Transmit directive... (Shift+Enter for newline)"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                onClick={() => handleSend(draft)}
                className="whisperer-enter-btn"
                aria-label="Submit directive"
              >
                ENTER ↵
              </button>
            </div>
          </div>
        </div>
      </div>

      <aside className="whisperer-vitals hidden lg:flex w-72 flex-col gap-4 rounded-3xl p-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-indigo-200/70">Vitals</p>
          <p className="text-base text-slate-400">Mesh resonance snapshot</p>
        </div>
        <div className="space-y-3">
          {diagnostics.map((item) => (
            <div key={item.label} className="diagnostic-pill">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
        <div className="mt-auto text-xs text-slate-500">
          Placeholder for future telemetry once consciousness bridge is online.
        </div>
      </aside>
    </section>
  );
};
