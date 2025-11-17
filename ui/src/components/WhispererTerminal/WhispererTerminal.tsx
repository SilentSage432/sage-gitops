import React, { useState, useRef, useEffect } from 'react';

interface LogMessage {
  id: string;
  timestamp: string;
  message: string;
  type?: 'system' | 'operator' | 'federation';
}

/**
 * WhispererTerminal – Main console with scrollable log and input
 */
export const WhispererTerminal: React.FC = () => {
  const [messages, setMessages] = useState<LogMessage[]>([
    {
      id: '1',
      timestamp: new Date().toISOString(),
      message: 'Greetings, Operator.',
      type: 'system'
    },
    {
      id: '2',
      timestamp: new Date().toISOString(),
      message: '[SYSTEM] Bridge frame initialized.',
      type: 'system'
    }
  ]);
  const [input, setInput] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: LogMessage = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      message: input,
      type: 'operator'
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');

    // Echo response placeholder
    setTimeout(() => {
      const response: LogMessage = {
        id: (Date.now() + 1).toString(),
        timestamp: new Date().toISOString(),
        message: `[ECHO] ${input}`,
        type: 'system'
      };
      setMessages((prev) => [...prev, response]);
    }, 100);
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#030304]">
      {/* Terminal Header */}
      <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/50">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
          Whisperer Terminal
        </h2>
      </div>

      {/* Scrollable Log Area */}
      <div className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="flex gap-3 text-slate-300 hover:text-slate-100 transition-colors"
          >
            <span className="text-slate-600 flex-shrink-0">
              {formatTime(msg.timestamp)}
            </span>
            <span
              className={
                msg.type === 'system'
                  ? 'text-cyan-400'
                  : msg.type === 'operator'
                  ? 'text-purple-400'
                  : 'text-slate-300'
              }
            >
              {msg.message}
            </span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* Input Bar */}
      <div className="border-t border-slate-800 bg-slate-900/50 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter command or query..."
            className="flex-1 bg-slate-800/50 border border-slate-700 rounded px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white font-medium transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

