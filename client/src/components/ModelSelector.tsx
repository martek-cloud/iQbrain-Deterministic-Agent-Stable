import { useState, useEffect, useRef, useMemo } from 'react';
import { FREE_MODELS } from '@iqbrain/shared-types';
import type { OpenRouterModel } from '@iqbrain/shared-types';

interface Props {
  selectedModel: string;
  onChange: (modelId: string) => void;
}

function providerFromId(id: string): string {
  return (id.split('/')[0] ?? id).replace(/-/g, ' ');
}

function isFreeModel(id: string): boolean {
  return id.endsWith(':free');
}

function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(0)}M ctx`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K ctx`;
  return `${tokens} ctx`;
}

export function ModelSelector({ selectedModel, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch real models from backend (which proxies OpenRouter)
  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch('/api/models')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ models: OpenRouterModel[] }>;
      })
      .then((json) => setModels(json.models))
      .catch(() => {
        setError(true);
        // Fall back to the hardcoded free models
        setModels(
          FREE_MODELS.map((m) => ({
            id: m.id,
            name: m.name,
            context_length: m.contextWindow,
            pricing: { prompt: '0', completion: '0' },
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-focus search when dropdown opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return models;
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        providerFromId(m.id).toLowerCase().includes(q)
    );
  }, [models, search]);

  // Partition into free / paid for display
  const freeModels = useMemo(() => filtered.filter((m) => isFreeModel(m.id)), [filtered]);
  const paidModels = useMemo(() => filtered.filter((m) => !isFreeModel(m.id)), [filtered]);

  const selectedLabel = useMemo(() => {
    const found = models.find((m) => m.id === selectedModel);
    if (found) return found.name;
    const fallback = FREE_MODELS.find((m) => m.id === selectedModel);
    return fallback?.name ?? selectedModel.split('/').pop() ?? selectedModel;
  }, [models, selectedModel]);

  function ModelRow({ m }: { m: OpenRouterModel }) {
    const isSelected = m.id === selectedModel;
    const free = isFreeModel(m.id);
    return (
      <button
        key={m.id}
        onClick={() => { onChange(m.id); setOpen(false); setSearch(''); }}
        className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 hover:bg-zinc-800 transition-colors group ${isSelected ? 'bg-zinc-800/70' : ''}`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-200 text-xs font-medium truncate">{m.name}</span>
            {free && (
              <span className="flex-shrink-0 text-[9px] text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-1 py-0.5 leading-none">
                FREE
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-zinc-500 text-[10px] capitalize truncate">{providerFromId(m.id)}</span>
            {m.context_length > 0 && (
              <span className="text-zinc-600 text-[10px]">· {formatContextWindow(m.context_length)}</span>
            )}
          </div>
        </div>
        {isSelected && (
          <svg className="flex-shrink-0 text-amber-400" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer hover:border-zinc-600 transition-colors flex items-center gap-1.5 max-w-[200px]"
        title="Select LLM model"
      >
        <span className="truncate">
          {loading ? 'Loading…' : error ? `${selectedLabel} (offline)` : selectedLabel}
        </span>
        <svg
          className={`flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
        >
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Search input */}
          <div className="px-2 pt-2 pb-1.5 border-b border-zinc-800">
            <div className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-lg px-2 focus-within:border-amber-500/60 focus-within:ring-1 focus-within:ring-amber-500/20 transition-all">
              <svg className="flex-shrink-0 text-zinc-500" width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="4.5" cy="4.5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M7.5 7.5L10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models…"
                className="flex-1 bg-transparent text-zinc-200 text-xs py-1.5 focus:outline-none placeholder-zinc-500"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Model list */}
          <div className="overflow-y-auto max-h-72 scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-zinc-500 text-xs text-center">No models match "{search}"</div>
            ) : (
              <>
                {freeModels.length > 0 && (
                  <>
                    <div className="px-3 pt-2 pb-1">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Free</span>
                    </div>
                    {freeModels.map((m) => <ModelRow key={m.id} m={m} />)}
                  </>
                )}
                {paidModels.length > 0 && (
                  <>
                    <div className="px-3 pt-2 pb-1">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Paid</span>
                    </div>
                    {paidModels.map((m) => <ModelRow key={m.id} m={m} />)}
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer count */}
          <div className="px-3 py-1.5 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-[10px] text-zinc-600">
              {filtered.length} model{filtered.length !== 1 ? 's' : ''} {search ? `matching "${search}"` : 'available'}
            </span>
            {error && <span className="text-[10px] text-red-400">Showing fallback models</span>}
          </div>
        </div>
      )}
    </div>
  );
}
