import React, { useEffect, useRef } from 'react';
import { TypingIndicator } from './TypingIndicator';
import { WhispererMessage } from './whispererTypes';

interface WhispererMessageLogProps {
  messages: WhispererMessage[];
  isThinking?: boolean;
}

export const WhispererMessageLog: React.FC<WhispererMessageLogProps> = ({ messages, isThinking }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div ref={containerRef} className="whisperer-log overflow-y-auto flex-1 rounded-xl">
      {messages.map((message) => (
        <div key={message.id} className={`message-row ${message.type}`}>
          <div className={`whisperer-message ${message.type}`}>
            <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
            <p className="content">{message.content}</p>
          </div>
        </div>
      ))}

      {isThinking && (
        <div className="message-row sage thinking" aria-live="polite">
          <TypingIndicator />
        </div>
      )}
    </div>
  );
};
