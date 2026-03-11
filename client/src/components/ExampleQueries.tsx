import { useConfigContext } from '../context/ConfigContext';

const DEFAULT_EXAMPLES = [
  { icon: '⚡', label: 'Change Impact', query: 'What is the impact of replacing R245 with R250?', color: 'hover:border-amber-500/40 hover:bg-amber-500/5' },
  { icon: '🔍', label: 'Where-Used', query: 'Show me all assemblies that use part R245', color: 'hover:border-blue-500/40 hover:bg-blue-500/5' },
  { icon: '📋', label: 'Closure Status', query: 'Show closure status for ECR-2221', color: 'hover:border-emerald-500/40 hover:bg-emerald-500/5' },
  { icon: '⏱', label: 'Cycle Time', query: 'What is the cycle time for ECR-2221?', color: 'hover:border-violet-500/40 hover:bg-violet-500/5' },
  { icon: '📊', label: 'BOM Compare', query: 'Does the MBOM match the EBOM for Motor Controller V2?', color: 'hover:border-cyan-500/40 hover:bg-cyan-500/5' },
];

const CARD_COLORS = [
  'hover:border-amber-500/40 hover:bg-amber-500/5',
  'hover:border-blue-500/40 hover:bg-blue-500/5',
  'hover:border-emerald-500/40 hover:bg-emerald-500/5',
  'hover:border-violet-500/40 hover:bg-violet-500/5',
  'hover:border-cyan-500/40 hover:bg-cyan-500/5',
  'hover:border-pink-500/40 hover:bg-pink-500/5',
];

interface Props {
  onSelect: (query: string) => void;
}

export function ExampleQueries({ onSelect }: Props) {
  const { config } = useConfigContext();

  const examples = (config?.examplePrompts && config.examplePrompts.length > 0)
    ? config.examplePrompts.map((p, i) => ({ ...p, color: CARD_COLORS[i % CARD_COLORS.length] }))
    : DEFAULT_EXAMPLES;

  const appName = config?.appName ?? 'IQBrain';
  const appTagline = config?.appTagline ?? 'Manufacturing AI';

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-10">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 border"
          style={{ backgroundColor: `${config?.accentColor ?? '#f59e0b'}20`, borderColor: `${config?.accentColor ?? '#f59e0b'}40` }}
        >
          <span className="text-xl font-bold font-mono-code" style={{ color: config?.accentColor ?? '#f59e0b' }}>
            {appName.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-zinc-100 mb-1">{appName}</h1>
        <p className="text-zinc-400 text-sm">
          {appTagline} · Ask anything about your change ecosystem.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl w-full">
        {examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => onSelect(ex.query)}
            className={`text-left p-3.5 rounded-xl border border-zinc-800 bg-zinc-900 transition-all duration-150 group ${ex.color}`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">{ex.icon}</span>
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{ex.label}</span>
            </div>
            <p className="text-sm text-zinc-300 leading-snug group-hover:text-zinc-200 transition-colors">
              {ex.query}
            </p>
          </button>
        ))}
      </div>

      <p className="mt-8 text-zinc-600 text-xs">Click a card to populate the input · Edit before sending</p>
    </div>
  );
}
