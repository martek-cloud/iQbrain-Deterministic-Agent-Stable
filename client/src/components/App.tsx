import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { CiSettings, CiLogout, CiPaperplane } from 'react-icons/ci';
import { FREE_MODELS } from '@iqbrain/shared-types';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { useConfig } from '../hooks/useConfig';
import { ConfigContext } from '../context/ConfigContext';
import { MessageList } from './MessageList';
import { StatusLine } from './StatusLine';
import { ExampleQueries } from './ExampleQueries';
import { ModelSelector } from './ModelSelector';
import { LoginPage } from './LoginPage';
import { AdminPanel } from './AdminPanel';

export default function App() {
  const auth = useAuth();
  const { config, isLoading: configLoading, saveConfig } = useConfig(auth.token);

  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(FREE_MODELS[0].id);
  const [showAdmin, setShowAdmin] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, isLoading, currentStatus, sendMessage, clearMessages } = useChat({
    useMock: false,
    token: auth.token,
  });

  // Apply branding dynamically
  useEffect(() => {
    if (!config) return;
    document.title = `${config.appName} — ${config.appTagline}`;
    document.documentElement.style.setProperty('--accent', config.accentColor);
  }, [config]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await sendMessage(trimmed, selectedModel);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  if (auth.isLoading || (auth.user && configLoading)) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <svg className="animate-spin w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!auth.user) return <LoginPage auth={auth} />;

  const appName = config?.appName ?? 'IQBrain';
  const appTagline = config?.appTagline ?? 'Manufacturing AI';
  const accent = config?.accentColor ?? '#f59e0b';

  return (
    <ConfigContext.Provider value={{ config, isLoading: configLoading, saveConfig }}>
      <div className="flex flex-col h-screen bg-zinc-950">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950 z-10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accent }}>
              <span className="text-zinc-950 font-bold text-xs font-mono-code">{appName.slice(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <span className="font-semibold text-zinc-100 text-sm tracking-tight">{appName}</span>
              <span className="ml-2 text-zinc-500 text-xs">{appTagline}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ModelSelector selectedModel={selectedModel} onChange={setSelectedModel} token={auth.token} />
            {messages.length > 0 && (
              <button onClick={clearMessages} className="text-zinc-500 hover:text-zinc-300 text-xs px-2 py-1 rounded hover:bg-zinc-800 transition-colors ml-1">
                Clear
              </button>
            )}
            {/* Settings */}
            <button
              onClick={() => setShowAdmin(true)}
              className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded hover:bg-zinc-800 transition-colors ml-1"
              title="Admin settings"
            >
              <CiSettings className="text-xl" />
            </button>
            {/* User + logout */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-800 ml-1">
              <span className="text-zinc-400 text-xs hidden sm:block">{auth.user.displayName}</span>
              <button
                onClick={auth.logout}
                className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded hover:bg-zinc-800 transition-colors"
                title="Sign out"
              >
                <CiLogout className="text-xl" />
              </button>
            </div>
          </div>
        </header>

        {/* Message area */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {messages.length === 0 ? (
            <div className="flex-1 overflow-y-auto">
              <ExampleQueries onSelect={(q) => { setInput(q); textareaRef.current?.focus(); }} />
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
                className="flex-shrink-0 w-7 h-7 rounded-lg disabled:bg-zinc-700 disabled:cursor-not-allowed text-zinc-950 disabled:text-zinc-500 flex items-center justify-center transition-colors mb-0.5"
                style={{ backgroundColor: (!input.trim() || isLoading) ? undefined : accent }}
                title="Send (Enter)"
              >
                <CiPaperplane className="text-base" />
              </button>
            </div>
            <p className="text-center text-zinc-600 text-xs mt-1.5">
              Press <kbd className="font-mono-code text-zinc-500">Enter</kbd> to send ·{' '}
              <kbd className="font-mono-code text-zinc-500">Shift+Enter</kbd> for new line
            </p>
          </div>
        </div>
      </div>

      {/* Admin panel overlay */}
      {showAdmin && config && (
        <AdminPanel config={config} onSave={saveConfig} onClose={() => setShowAdmin(false)} />
      )}
    </ConfigContext.Provider>
  );
}
