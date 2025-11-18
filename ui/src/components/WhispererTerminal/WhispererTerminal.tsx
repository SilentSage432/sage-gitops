import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WhispererInput } from './WhispererInput';
import { WhispererMessageLog } from './WhispererMessageLog';
import { parseCommand } from './commandParser';
import { resolveSageResponse } from './sageResponder';
import { WhispererIntent, WhispererMessage } from './whispererTypes';
import './whisperer.css';

const createMessage = (
  type: WhispererMessage['type'],
  content: string,
  intent?: WhispererIntent,
): WhispererMessage => ({
  id: `${type}-${crypto.randomUUID?.() ?? Date.now()}`,
  type,
  content,
  timestamp: new Date().toISOString(),
  intent,
});

export const WhispererTerminal: React.FC = () => {
  const [messages, setMessages] = useState<WhispererMessage[]>(() => [
    createMessage('system', 'Whisperer Terminal 3.0 initialized. Awaiting operator signal.'),
  ]);
  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const enqueueMessage = useCallback((message: WhispererMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const handleSend = useCallback(
    (content: string) => {
      const parsed = parseCommand(content);
      enqueueMessage(createMessage('operator', content, parsed.intent));

      if (replyTimerRef.current) {
        clearTimeout(replyTimerRef.current);
      }

      setIsThinking(true);
      const { delay, content: responseContent } = resolveSageResponse(parsed);

      replyTimerRef.current = window.setTimeout(() => {
        enqueueMessage(createMessage('sage', responseContent, parsed.intent));
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

  const diagnostics = useMemo(
    () => [
      { label: 'Signal', value: 'Aligned' },
      { label: 'Flux', value: `${messages.length} msgs` },
      { label: 'Bridge', value: 'Stable' },
    ],
    [messages.length],
  );

  return (
    <section className="whisperer-terminal holo-console flex-1 flex flex-row gap-6 p-6 snap-pinned">
      <div className="flex flex-1 flex-col gap-4 min-w-0">
        <header className="terminal-header flex items-center justify-between rounded-2xl px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Primary Console</p>
            <h2 className="text-2xl font-semibold text-white">Whisperer Terminal</h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Phase 2 · Refinement</p>
            <p className="text-xs text-slate-500">Enterprise channel · Offline logic</p>
          </div>
        </header>

        <div className="flex flex-1 flex-col min-h-0 rounded-3xl border border-slate-900/60 bg-[#050506]">
          <WhispererMessageLog messages={messages} isThinking={isThinking} />
          <div className="border-t border-slate-900/50 p-4">
            <WhispererInput onSend={handleSend} />
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
