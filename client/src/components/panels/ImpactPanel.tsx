import type { ImpactData } from '@iqbrain/shared-types';

const fmt = (n: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const ORDER_STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: 'text-amber-400 bg-amber-400/10',
  PLANNED: 'text-blue-400 bg-blue-400/10',
  COMPLETE: 'text-emerald-400 bg-emerald-400/10',
  ON_HOLD: 'text-red-400 bg-red-400/10',
};

interface Props {
  data: ImpactData;
}

export function ImpactPanel({ data }: Props) {
  const { financialSummary: fs } = data;

  return (
    <div className="space-y-3 text-sm">
      {/* Change card */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-amber-400 text-xs font-mono-code font-medium">CHANGE SCOPE</span>
        </div>
        <div className="flex gap-3 flex-wrap text-xs text-zinc-400">
          <span>Source: <span className="text-zinc-200 font-mono-code">{data.sourcePart}</span></span>
          {data.targetPart && <span>→ Target: <span className="text-zinc-200 font-mono-code">{data.targetPart}</span></span>}
          <span>Type: <span className="text-zinc-300">{data.analysisType.replace(/_/g, ' ')}</span></span>
        </div>
      </div>

      {/* Financial exposure */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'WIP Exposure', value: fs.wipExposure, color: 'text-amber-400' },
          { label: 'Inventory', value: fs.inventoryExposure, color: 'text-blue-400' },
          { label: 'Total Exposure', value: fs.totalExposure, color: 'text-red-400' },
        ].map((item) => (
          <div key={item.label} className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 text-center">
            <div className={`font-semibold font-mono-code ${item.color}`}>{fmt(item.value, fs.currency)}</div>
            <div className="text-zinc-500 text-xs mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Affected assemblies */}
      {data.affectedAssemblies.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3">
          <div className="text-amber-400 text-xs font-mono-code font-medium mb-2">
            AFFECTED ASSEMBLIES ({data.affectedAssemblies.length})
          </div>
          <div className="space-y-1">
            {data.affectedAssemblies.map((a) => (
              <div key={a.assemblyId} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-zinc-500 font-mono-code text-xs"
                    style={{ paddingLeft: `${(a.depth - 1) * 12}px` }}
                  >
                    {'└─'}
                  </span>
                  <span className="text-zinc-200 font-mono-code text-xs">{a.assemblyId}</span>
                  <span className="text-zinc-500 text-xs">{a.assemblyName}</span>
                </div>
                {a.isTopLevel && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">TOP</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Production orders */}
      {data.productionOrders.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-800">
            <span className="text-amber-400 text-xs font-mono-code font-medium">
              PRODUCTION ORDERS ({data.productionOrders.length})
            </span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800">
                <th className="text-left px-3 py-1.5 font-normal">Order</th>
                <th className="text-left px-3 py-1.5 font-normal">Assembly</th>
                <th className="text-left px-3 py-1.5 font-normal">Status</th>
                <th className="text-right px-3 py-1.5 font-normal">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.productionOrders.map((po) => (
                <tr key={po.orderId} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="px-3 py-1.5 font-mono-code text-zinc-300">{po.orderId}</td>
                  <td className="px-3 py-1.5 text-zinc-400">{po.assemblyId}</td>
                  <td className="px-3 py-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${ORDER_STATUS_COLORS[po.status] ?? 'text-zinc-400'}`}>
                      {po.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono-code text-zinc-300">
                    {fmt(po.estimatedValue, po.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
