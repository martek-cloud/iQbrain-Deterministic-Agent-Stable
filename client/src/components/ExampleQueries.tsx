interface ExampleCard {
  icon: string;
  label: string;
  query: string;
  workflowType: string;
  color: string;
}

const EXAMPLES: ExampleCard[] = [
  {
    icon: '⚡',
    label: 'Change Impact',
    query: 'What is the impact of replacing R245 with R250?',
    workflowType: 'change_impact_analysis',
    color: 'hover:border-amber-500/40 hover:bg-amber-500/5',
  },
  {
    icon: '🔍',
    label: 'Where-Used',
    query: 'Show me all assemblies that use part R245',
    workflowType: 'where_used_analysis',
    color: 'hover:border-blue-500/40 hover:bg-blue-500/5',
  },
  {
    icon: '📋',
    label: 'Closure Status',
    query: 'Show closure status for ECR-2221',
    workflowType: 'closure_status_query',
    color: 'hover:border-emerald-500/40 hover:bg-emerald-500/5',
  },
  {
    icon: '⏱',
    label: 'Cycle Time',
    query: 'What is the cycle time for ECR-2221?',
    workflowType: 'cycle_time_single',
    color: 'hover:border-violet-500/40 hover:bg-violet-500/5',
  },
  {
    icon: '📊',
    label: 'BOM Compare',
    query: 'Does the MBOM match the EBOM for Motor Controller V2?',
    workflowType: 'bom_comparison_ebom_mbom',
    color: 'hover:border-cyan-500/40 hover:bg-cyan-500/5',
  },
];

interface Props {
  onSelect: (query: string) => void;
}

export function ExampleQueries({ onSelect }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-amber-400 text-xl font-bold font-mono-code">IQ</span>
        </div>
        <h1 className="text-2xl font-semibold text-zinc-100 mb-1">IQBrain</h1>
        <p className="text-zinc-400 text-sm">Manufacturing intelligence. Ask anything about your change ecosystem.</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl w-full">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.workflowType}
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
