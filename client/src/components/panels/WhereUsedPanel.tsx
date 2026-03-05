import type { WhereUsedData, WhereUsedNode } from '@iqbrain/shared-types';

function TreeNode({ node, depth = 0 }: { node: WhereUsedNode; depth?: number }) {
  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-1 hover:bg-zinc-800/40 rounded px-1 transition-colors"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        {depth > 0 && <span className="text-zinc-600 font-mono-code text-xs">└─</span>}
        <span className="text-zinc-200 font-mono-code text-xs">{node.assemblyId}</span>
        <span className="text-zinc-500 text-xs">{node.assemblyName}</span>
        {node.isTopLevel && (
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            TOP
          </span>
        )}
        <span className="ml-auto text-zinc-600 text-[10px] font-mono-code">d{node.depth}</span>
      </div>
      {node.children.map((child) => (
        <TreeNode key={child.assemblyId} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

interface Props {
  data: WhereUsedData;
}

export function WhereUsedPanel({ data }: Props) {
  return (
    <div className="space-y-3 text-sm">
      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Assemblies', value: data.totalAssemblies, color: 'text-blue-400' },
          { label: 'Top-Level', value: data.topLevelCount, color: 'text-emerald-400' },
          { label: 'Max Depth', value: data.maxDepthReached, color: 'text-amber-400' },
        ].map((m) => (
          <div key={m.label} className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 text-center">
            <div className={`text-lg font-semibold font-mono-code ${m.color}`}>{m.value}</div>
            <div className="text-zinc-500 text-xs mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Tree */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3">
        <div className="text-blue-400 text-xs font-mono-code font-medium mb-2">
          WHERE-USED TREE · {data.partNumber}
        </div>
        {data.tree.map((node) => (
          <TreeNode key={node.assemblyId} node={node} depth={0} />
        ))}
      </div>
    </div>
  );
}
