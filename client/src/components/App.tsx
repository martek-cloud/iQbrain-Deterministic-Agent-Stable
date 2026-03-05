import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { FREE_MODELS } from '@iqbrain/shared-types';
import { useChat } from '../hooks/useChat';
import { MessageList } from './MessageList';
import { StatusLine } from './StatusLine';
import { ExampleQueries } from './ExampleQueries';
import { ModelSelector } from './ModelSelector';

export default function App() {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(FREE_MODELS[0].id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Switch to false to use real backend (P2-T6)
  const { messages, isLoading, currentStatus, sendMessage, clearMessages } = useChat({ useMock: true });

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await sendMessage(trimmed, selectedModel);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleExampleClick = (query: string) => {
    setInput(query);
    textareaRef.current?.focus();
  };

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950 z-10 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-amber-500 flex items-center justify-center flex-shrink-0">
            <span className="text-zinc-950 font-bold text-xs font-mono-code">IQ</span>
          </div>
          <div>
            <span className="font-semibold text-zinc-100 text-sm tracking-tight">IQBrain</span>
            <span className="ml-2 text-zinc-500 text-xs">Manufacturing AI</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModelSelector selectedModel={selectedModel} onChange={setSelectedModel} />
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="text-zinc-500 hover:text-zinc-300 text-xs px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
              title="Clear conversation"
            >
              Clear
            </button>
          )}
        </div>
      </header>

      {/* Message area */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {messages.length === 0 ? (
          <div className="flex-1 overflow-y-auto">
            <ExampleQueries onSelect={handleExampleClick} />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <MessageList messages={messages} isLoading={isLoading} />
            {currentStatus && (
              <div className="px-4 pb-2 flex-shrink-0">
                <StatusLine phase={currentStatus.phase} label={currentStatus.label} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-950 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/20 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about part changes, where-used, closure status, cycle time, BOM comparison…"
              disabled={isLoading}
              rows={1}
              className="flex-1 bg-transparent text-zinc-100 text-sm placeholder-zinc-500 resize-none focus:outline-none min-h-[24px] max-h-40 leading-6 py-0.5 disabled:opacity-50"
            />
            <button
              onClick={() => void handleSend()}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-zinc-950 flex items-center justify-center transition-colors mb-0.5"
              title="Send (Enter)"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M1 12L12 6.5L1 1V5.5L9 6.5L1 7.5V12Z" fill="currentColor" />
              </svg>
            </button>
          </div>
          <p className="text-center text-zinc-600 text-xs mt-1.5">
            Press <kbd className="font-mono-code text-zinc-500">Enter</kbd> to send · <kbd className="font-mono-code text-zinc-500">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
}
