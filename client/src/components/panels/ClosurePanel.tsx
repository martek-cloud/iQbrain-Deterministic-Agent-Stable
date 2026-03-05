import type { ClosureData } from '@iqbrain/shared-types';

const STATUS_COLORS: Record<string, string> = {
  COMPLETE: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30',
  PARTIAL: 'text-amber-400 bg-amber-400/10 border-amber-500/30',
  NOT_STARTED: 'text-red-400 bg-red-400/10 border-red-500/30',
};

const MBOM_STATUS_COLORS: Record<string, string> = {
  UPDATED: 'text-emerald-400',
  PENDING: 'text-amber-400',
  NOT_APPLICABLE: 'text-zinc-500',
};

interface Props {
  data: ClosureData;
}

export function ClosurePanel({ data }: Props) {
  const erpPct = data.mbomUpdatesRequired > 0
    ? Math.round((data.mbomUpdatesComplete / data.mbomUpdatesRequired) * 100)
    : 0;
  const mesPct = data.ordersAffected > 0
    ? Math.round((data.ordersAligned / data.ordersAffected) * 100)
    : 0;

  return (
    <div className="space-y-3 text-sm">
      {/* Header: change ID + lag + bottleneck */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-xs text-zinc-500">Change</span>
          <span className="ml-2 font-mono-code text-zinc-200">{data.changeId}</span>
        </div>
        <div className="flex items-center gap-2">
          {data.bottleneck && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/30">
              Bottleneck: {data.bottleneck}
            </span>
          )}
          <span className="text-xs text-zinc-400">
            Lag: <span className="text-amber-400 font-mono-code">{data.lagDays}d</span>
          </span>
        </div>
      </div>

      {/* System progress */}
      <div className="grid grid-cols-2 gap-2">
        {/* ERP */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 font-medium">ERP / MBOM</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLORS[data.erpStatus] ?? STATUS_COLORS.NOT_STARTED}`}>
              {data.erpStatus.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="text-lg font-semibold font-mono-code text-amber-400">
            {data.mbomUpdatesComplete}/{data.mbomUpdatesRequired}
          </div>
          <div className="text-xs text-zinc-500">MBOMs updated</div>
          <div className="mt-2 h-1.5 rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${erpPct}%` }}
            />
          </div>
        </div>

        {/* MES */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 font-medium">MES / Orders</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLORS[data.mesStatus] ?? STATUS_COLORS.NOT_STARTED}`}>
              {data.mesStatus.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="text-lg font-semibold font-mono-code text-blue-400">
            {data.ordersAligned}/{data.ordersAffected}
          </div>
          <div className="text-xs text-zinc-500">Orders aligned</div>
          <div className="mt-2 h-1.5 rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${mesPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* MBOM update details */}
      {data.mbomUpdateDetails.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-800">
            <span className="text-emerald-400 text-xs font-mono-code font-medium">MBOM PROPAGATION</span>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {data.mbomUpdateDetails.map((d) => (
              <div key={d.mbomId} className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'UPDATED' ? 'bg-emerald-400' : d.status === 'PENDING' ? 'bg-amber-400' : 'bg-zinc-600'}`} />
                  <span className="font-mono-code text-xs text-zinc-300">{d.mbomId}</span>
                  <span className="text-zinc-500 text-xs">{d.assemblyId}</span>
                </div>
                <span className={`text-xs font-medium ${MBOM_STATUS_COLORS[d.status]}`}>
                  {d.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
