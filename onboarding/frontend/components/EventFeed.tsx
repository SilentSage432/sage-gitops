'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Radio } from 'lucide-react';

interface Event {
  id: string;
  timestamp: Date;
  message: string;
}

const EVENT_MESSAGES = [
  'Node initialized successfully',
  'Mesh connection established',
  'Heartbeat synchronized',
  'Cognitive link handshake initiated',
  'Neural pathways activated',
  'Memory core online',
  'Signal processing active',
  'Data stream connected',
  'Awareness layer initializing',
  'Consciousness bridge forming',
  'Operator interface ready',
  'Federation protocols loaded',
  'Security mesh engaged',
  'Knowledge stream flowing',
  'Agent discovery active',
  'System integrity verified',
  'Quantum state stabilized',
  'Temporal sync complete',
  'Dimensional anchor secured',
  'Reality matrix aligned',
];

const STORAGE_KEY = 'personalEventFeed';

export function EventFeed() {
  const [events, setEvents] = useState<Event[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageIndexRef = useRef(0);

  // Load persisted events on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }));
        setEvents(parsed);
        messageIndexRef.current = parsed.length % EVENT_MESSAGES.length;
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    }
  }, []);

  // Add new event every 5-10 seconds
  useEffect(() => {
    const getRandomInterval = () => Math.random() * 5000 + 5000; // 5-10 seconds

    const addEvent = () => {
      const newEvent: Event = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        message: EVENT_MESSAGES[messageIndexRef.current % EVENT_MESSAGES.length],
      };

      messageIndexRef.current++;

      setEvents((prev) => {
        const updated = [...prev, newEvent].slice(-20); // Keep last 20
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    };

    // Add first event immediately
    addEvent();

    const interval = setInterval(() => {
      addEvent();
    }, getRandomInterval());

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Card className="rounded-3xl bg-neutral-900/60 border border-white/10 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-violet-400" />
          Event Stream
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] overflow-auto pr-2" ref={scrollRef}>
          <div className="space-y-2">
            {events.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-8">Waiting for events...</p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-2 rounded border border-white/5 bg-[#1a1d22]/50 hover:bg-[#1a1d22] transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/60 font-mono mb-1">{formatTime(event.timestamp)}</p>
                    <p className="text-sm text-white/80">{event.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

