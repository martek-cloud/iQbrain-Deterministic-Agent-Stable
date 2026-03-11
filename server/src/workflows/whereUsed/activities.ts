import { PARTS, ASSEMBLIES, RELATIONSHIPS, PRODUCTION_ORDERS } from '../../adapters/data';
import type { WhereUsedNode, ProductionOrderSummary } from '../../types/intents';

export function resolvePartIdentity(partNumber: string): string | null {
  const upper = partNumber.toUpperCase();
  const part = PARTS[upper];
  if (part) return part.canonicalId;
  // Also check if it's an assembly part number
  const assembly = ASSEMBLIES[upper];
  return assembly ? assembly.canonicalId : null;
}

export function recursiveWhereUsed(
  canonicalId: string,
  visited: Set<string> | unknown = new Set(),
  depth = 0,
  maxDepth = 10
): WhereUsedNode[] {
  const seen = visited instanceof Set ? visited : new Set<string>();
  if (depth >= maxDepth || seen.has(canonicalId)) return [];
  seen.add(canonicalId);

  const nodes: WhereUsedNode[] = [];
  const usedInRels = RELATIONSHIPS.filter((r) => r.fromId === canonicalId && r.type === 'USED_IN');

  for (const rel of usedInRels) {
    const assembly = Object.values(ASSEMBLIES).find((a) => a.canonicalId === rel.toId);
    if (!assembly) continue;
    const children = recursiveWhereUsed(rel.toId, seen, depth + 1, maxDepth);
    nodes.push({
      assemblyId: assembly.assemblyId,
      assemblyName: assembly.name,
      depth: depth + 1,
      isTopLevel: assembly.isTopLevel,
      children,
    });
  }
  return nodes;
}

export function flattenTree(nodes: WhereUsedNode[]): WhereUsedNode[] {
  const flat: WhereUsedNode[] = [];
  for (const n of nodes) {
    flat.push(n);
    flat.push(...flattenTree(n.children));
  }
  return flat;
}

export function optionalProductionOrderBranch(assemblyIds: string[]): ProductionOrderSummary[] {
  return Object.values(PRODUCTION_ORDERS)
    .filter((po) => assemblyIds.includes(po.assemblyId))
    .map((po) => ({
      orderId: po.orderId,
      assemblyId: po.assemblyId,
      status: po.status,
      estimatedValue: po.estimatedValue,
      currency: po.currency,
      quantity: po.quantity,
    }));
}
