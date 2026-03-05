import type { ParsedIntent, IntentType } from '@iqbrain/shared-types';

const INTENT_LABELS: Record<IntentType, string> = {
  change_impact_analysis: 'Change Impact',
  where_used_analysis: 'Where-Used',
  closure_status_query: 'Closure Status',
  cycle_time_single: 'Cycle Time',
  bom_comparison_ebom_mbom: 'BOM Compare',
  supply_chain_query: 'Supply Chain',
  change_history_query: 'Change History',
  bom_version_compare: 'BOM Version',
  part_lifecycle_query: 'Part Lifecycle',
  unknown: 'Unknown',
};

const INTENT_COLORS: Record<IntentType, string> = {
  change_impact_analysis: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  where_used_analysis: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  closure_status_query: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  cycle_time_single: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  bom_comparison_ebom_mbom: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  supply_chain_query: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  change_history_query: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  bom_version_compare: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  part_lifecycle_query: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  unknown: 'bg-zinc-700/50 text-zinc-400 border-zinc-600',
};

interface Props {
  intent: ParsedIntent;
}

export function IntentBadge({ intent }: Props) {
  const label = INTENT_LABELS[intent.intent] ?? intent.intent;
  const color = INTENT_COLORS[intent.intent] ?? INTENT_COLORS.unknown;
  const pct = Math.round(intent.confidence * 100);

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border font-mono-code ${color}`}
      title={`Intent: ${intent.intent} · Confidence: ${pct}%`}
    >
      <span>{label}</span>
      <span className="opacity-60">{pct}%</span>
    </span>
  );
}
