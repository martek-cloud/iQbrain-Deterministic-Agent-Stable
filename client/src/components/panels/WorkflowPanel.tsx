import type { WorkflowResult } from '@iqbrain/shared-types';
import { ImpactPanel } from './ImpactPanel';
import { WhereUsedPanel } from './WhereUsedPanel';
import { ClosurePanel } from './ClosurePanel';
import { CycleTimePanel } from './CycleTimePanel';
import { ReconcilePanel } from './ReconcilePanel';

interface Props {
  result: WorkflowResult;
}

const PANEL_HEADERS: Record<string, { label: string; color: string }> = {
  change_impact_analysis: { label: 'Change Impact Analysis', color: 'text-amber-400 border-amber-500/30' },
  where_used_analysis: { label: 'Where-Used Analysis', color: 'text-blue-400 border-blue-500/30' },
  closure_status_query: { label: 'Closure Status', color: 'text-emerald-400 border-emerald-500/30' },
  cycle_time_single: { label: 'Cycle Time', color: 'text-violet-400 border-violet-500/30' },
  bom_comparison_ebom_mbom: { label: 'EBOM / MBOM Comparison', color: 'text-cyan-400 border-cyan-500/30' },
  unknown: { label: 'Result', color: 'text-zinc-400 border-zinc-700' },
};

export function WorkflowPanel({ result }: Props) {
  if (result.status === 'error' || result.status === 'declined') {
    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-3 text-xs text-zinc-400">
        {result.errorMessage ?? 'Workflow did not complete.'}
      </div>
    );
  }

  const header = PANEL_HEADERS[result.workflowType] ?? PANEL_HEADERS.unknown;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 overflow-hidden">
      {/* Panel header */}
      <div className={`flex items-center justify-between px-3 py-2 border-b border-zinc-800`}>
        <span className={`text-xs font-mono-code font-medium ${header.color.split(' ')[0]}`}>
          {header.label}
        </span>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono-code">
          <span>{result.durationMs}ms</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
        </div>
      </div>

      {/* Panel content */}
      <div className="p-3">
        {result.workflowType === 'change_impact_analysis' && result.data && (
          <ImpactPanel data={result.data} />
        )}
        {result.workflowType === 'where_used_analysis' && result.data && (
          <WhereUsedPanel data={result.data} />
        )}
        {result.workflowType === 'closure_status_query' && result.data && (
          <ClosurePanel data={result.data} />
        )}
        {result.workflowType === 'cycle_time_single' && result.data && (
          <CycleTimePanel data={result.data} />
        )}
        {result.workflowType === 'bom_comparison_ebom_mbom' && result.data && (
          <ReconcilePanel data={result.data} />
        )}
      </div>

      {/* Steps footer */}
      {result.steps.length > 0 && (
        <div className="px-3 py-2 border-t border-zinc-800/50 flex gap-3 overflow-x-auto">
          {result.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-1 text-[10px] text-zinc-600 whitespace-nowrap">
              <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
              {step.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
