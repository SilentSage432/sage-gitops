'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface PersonalCommandBarProps {
  nodeId: string;
  callsign?: string;
  onStatusRequest: () => { meshReachability: string; heartbeatSync: string; cognitiveLink: string; lastPulse: Date };
}

export function PersonalCommandBar({ nodeId, callsign, onStatusRequest }: PersonalCommandBarProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [startTime] = useState(Date.now());
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    // Count events from localStorage
    const updateEventCount = () => {
      const stored = localStorage.getItem('personalEventFeed');
      if (stored) {
        try {
          const events = JSON.parse(stored);
          setEventCount(events.length);
        } catch (err) {
          // Ignore
        }
      }
    };

    updateEventCount();
    // Update event count periodically
    const interval = setInterval(updateEventCount, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleCommand = async (command: string) => {
    const cmd = command.trim().toLowerCase();
    const commandLog = (window as any).__commandLog;

    if (!commandLog) return;

    // Add command to log
    commandLog.addLog({ type: 'command', content: command });

    // Route command
    if (cmd === 'help') {
      const helpText = `Available commands:
  help       - Show this help message
  status     - Display mesh node status
  whoami     - Show node identity
  node.info  - Display node information
  clear      - Clear command log`;
      commandLog.addStreamingOutput(helpText);
    } else if (cmd === 'status') {
      const status = onStatusRequest();
      const statusText = `Mesh Reachability: ${status.meshReachability}
Heartbeat Sync: ${status.heartbeatSync}
Cognitive Link: ${status.cognitiveLink}
Last Pulse: ${status.lastPulse.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}`;
      commandLog.addStreamingOutput(statusText);
    } else if (cmd === 'whoami') {
      let whoamiText = `Node ID: ${nodeId}`;
      if (callsign) {
        whoamiText = `Callsign: ${callsign}\n${whoamiText}`;
      }
      commandLog.addStreamingOutput(whoamiText);
    } else if (cmd === 'node.info') {
      const uptime = Math.floor((Date.now() - startTime) / 1000);
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = uptime % 60;
      const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;
      
      const infoText = `Uptime: ${uptimeStr}
Event Count: ${eventCount}
Mode: Personal Mesh Node
Status: Standby`;
      commandLog.addStreamingOutput(infoText);
    } else if (cmd === 'clear') {
      commandLog.clearLogs();
    } else if (cmd === '') {
      // Empty command, do nothing
    } else {
      commandLog.addStreamingOutput("Unrecognized command. Type 'help' for available commands.");
    }

    setInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      handleCommand(input);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

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
            placeholder="Enter command... (type 'help' for commands)"
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

