import React, { useEffect, useRef } from 'react';
import { WhispererMessage } from './whispererTypes';

interface WhispererMessageLogProps {
  messages: WhispererMessage[];
}

export const WhispererMessageLog: React.FC<WhispererMessageLogProps> = ({ messages }) => {
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
        <div key={message.id} className={`whisperer-message ${message.type}`}>
          <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
          <p className="content">{message.content}</p>
        </div>
      ))}
    </div>
  );
};


