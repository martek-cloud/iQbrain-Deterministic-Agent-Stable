import type { ReconcileData, ReconcileCategory } from '@iqbrain/shared-types';

const CATEGORY_STYLE: Record<ReconcileCategory, { label: string; classes: string }> = {
  ALIGNED: { label: 'ALIGNED', classes: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30' },
  QTY_MISMATCH_EXPECTED: { label: 'QTY EXPECTED', classes: 'text-amber-400 bg-amber-400/10 border-amber-500/30' },
  QTY_MISMATCH_UNEXPECTED: { label: 'QTY UNEXPECTED', classes: 'text-red-400 bg-red-400/10 border-red-500/30' },
  MISSING_FROM_MBOM: { label: 'MISSING MBOM', classes: 'text-red-400 bg-red-400/10 border-red-500/30' },
  MBOM_ONLY_EXPECTED: { label: 'MBOM-ONLY OK', classes: 'text-amber-400 bg-amber-400/10 border-amber-500/30' },
  MBOM_ONLY_UNEXPECTED: { label: 'MBOM-ONLY !', classes: 'text-red-400 bg-red-400/10 border-red-500/30' },
  REVISION_MISMATCH: { label: 'REV MISMATCH', classes: 'text-orange-400 bg-orange-400/10 border-orange-500/30' },
};

interface Props {
  data: ReconcileData;
}

export function ReconcilePanel({ data }: Props) {
  return (
    <div className="space-y-3 text-sm">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 text-center">
          <div className="text-lg font-semibold font-mono-code text-zinc-300">{data.totalLines}</div>
          <div className="text-zinc-500 text-xs mt-0.5">Total Lines</div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 text-center">
          <div className="text-lg font-semibold font-mono-code text-emerald-400">{data.alignedCount}</div>
          <div className="text-zinc-500 text-xs mt-0.5">Aligned</div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 text-center">
          <div className="text-lg font-semibold font-mono-code text-red-400">{data.divergentCount}</div>
          <div className="text-zinc-500 text-xs mt-0.5">Divergent</div>
        </div>
      </div>

      {/* Diff table */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-zinc-800">
          <span className="text-cyan-400 text-xs font-mono-code font-medium">
            EBOM vs MBOM · {data.assemblyId}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[480px]">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800">
                <th className="text-left px-3 py-1.5 font-normal">Part</th>
                <th className="text-center px-2 py-1.5 font-normal">EBOM Qty</th>
                <th className="text-center px-2 py-1.5 font-normal">MBOM Qty</th>
                <th className="text-left px-3 py-1.5 font-normal">Classification</th>
                <th className="text-left px-3 py-1.5 font-normal">Notes</th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((line) => {
                const style = CATEGORY_STYLE[line.category] ?? CATEGORY_STYLE.ALIGNED;
                const isUnexpected = line.category.endsWith('UNEXPECTED') || line.category === 'MISSING_FROM_MBOM';
                return (
                  <tr
                    key={line.partNumber}
                    className={`border-b border-zinc-800/50 ${isUnexpected ? 'bg-red-500/5' : 'hover:bg-zinc-800/20'}`}
                  >
                    <td className="px-3 py-2">
                      <div className="font-mono-code text-zinc-300">{line.partNumber}</div>
                      <div className="text-zinc-500 text-[10px]">{line.partName}</div>
                    </td>
                    <td className="px-2 py-2 text-center font-mono-code text-zinc-400">
                      {line.ebomQty ?? '—'}
                    </td>
                    <td className="px-2 py-2 text-center font-mono-code text-zinc-400">
                      {line.mbomQty ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${style.classes}`}>
                        {style.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-zinc-500 text-[11px]">
                      {line.explanation ?? ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
