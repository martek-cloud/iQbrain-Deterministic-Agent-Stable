import type { CycleTimeData } from '@iqbrain/shared-types';

interface Props {
  data: CycleTimeData;
}

const STAGE_COLORS: Record<string, string> = {
  DRAFT: 'bg-zinc-600',
  REVIEW: 'bg-blue-500',
  APPROVAL: 'bg-amber-500',
  RELEASE: 'bg-emerald-500',
};

export function CycleTimePanel({ data }: Props) {
  const maxDays = Math.max(...data.stageBreakdown.map((s) => s.durationDays));

  return (
    <div className="space-y-3 text-sm">
      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 text-center">
          <div className="text-2xl font-semibold font-mono-code text-violet-400">{data.totalCycleDays}d</div>
          <div className="text-zinc-500 text-xs mt-0.5">Total Cycle</div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 text-center">
          <div className="text-lg font-semibold font-mono-code text-amber-400">{data.longestStage}</div>
          <div className="text-zinc-500 text-xs mt-0.5">Longest Stage</div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 text-center">
          <div className="text-2xl font-semibold font-mono-code text-red-400">{data.approvalCycles}</div>
          <div className="text-zinc-500 text-xs mt-0.5">Approval Cycles</div>
        </div>
      </div>

      {/* Stage breakdown */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3">
        <div className="text-violet-400 text-xs font-mono-code font-medium mb-3">
          STAGE BREAKDOWN · {data.changeId}
        </div>
        <div className="space-y-2">
          {data.stageBreakdown.map((stage) => (
            <div key={stage.stage}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-sm ${stage.stage === data.longestStage ? 'bg-amber-400' : (STAGE_COLORS[stage.stage] ?? 'bg-zinc-500')}`}
                  />
                  <span className="text-xs text-zinc-300 font-mono-code">{stage.stage}</span>
                  {stage.stage === data.longestStage && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      BOTTLENECK
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono-code text-zinc-400">{stage.durationDays}d</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all ${stage.stage === data.longestStage ? 'bg-amber-500' : (STAGE_COLORS[stage.stage] ?? 'bg-zinc-500')}`}
                  style={{ width: `${(stage.durationDays / maxDays) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className="flex gap-4 text-xs text-zinc-500 px-1">
        <span>Created: <span className="text-zinc-300">{data.createdAt.slice(0, 10)}</span></span>
        <span>Released: <span className="text-zinc-300">{data.releasedAt.slice(0, 10)}</span></span>
      </div>
    </div>
  );
}
