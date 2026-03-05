import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@iqbrain/shared-types';
import { MessageBubble } from './MessageBubble';

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  // Track whether user has scrolled up manually
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUp.current = distanceFromBottom > 100;
  };

  // Auto-scroll only when near bottom
  useEffect(() => {
    if (!userScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  // Reset scroll tracking when new user message starts
  useEffect(() => {
    if (isLoading) {
      userScrolledUp.current = false;
    }
  }, [isLoading]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0"
    >
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} className="h-1" />
    </div>
  );
}
