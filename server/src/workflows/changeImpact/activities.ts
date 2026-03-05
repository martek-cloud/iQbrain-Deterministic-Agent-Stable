import { PARTS, ASSEMBLIES, PRODUCTION_ORDERS, INVENTORY, RELATIONSHIPS } from '../../adapters/mock/data';
import type {
  AffectedAssembly,
  ProductionOrderSummary,
  FinancialSummary,
  ImpactData,
} from '../../types/intents';
import type { Relationship } from '../../types/canonical';

// NOTE (P5-T7): These activities access data via the toolRouter.getPLM/ERP/MES() interfaces.
// Current implementation calls mock data directly; swapping PLM_ADAPTER env var routes to real adapters.
// When Temporal activities are executed remotely, replace each direct import with an async adapter call:
//   const part = await toolRouter.getPLM().getPart(partNumber);

export function resolveIdentity(partNumber: string): string | null {
  const upper = partNumber.toUpperCase();
  const part = PARTS[upper];
  return part ? part.canonicalId : null;
}

export function traverseWhereUsed(
  canonicalId: string,
  visited: Set<string> = new Set(),
  depth = 0,
  maxDepth = 10
): AffectedAssembly[] {
  if (depth >= maxDepth || visited.has(canonicalId)) return [];
  visited.add(canonicalId);

  const results: AffectedAssembly[] = [];
  const usedInRels: Relationship[] = RELATIONSHIPS.filter(
    (r) => r.fromId === canonicalId && r.type === 'USED_IN'
  );

  for (const rel of usedInRels) {
    const assemblyEntry = Object.values(ASSEMBLIES).find((a) => a.canonicalId === rel.toId);
    if (!assemblyEntry) continue;
    results.push({
      assemblyId: assemblyEntry.assemblyId,
      assemblyName: assemblyEntry.name,
      depth: depth + 1,
      isTopLevel: assemblyEntry.isTopLevel,
    });
    results.push(...traverseWhereUsed(rel.toId, visited, depth + 1, maxDepth));
  }
  return results;
}

export function getProductionOrdersForAssemblies(assemblyIds: string[]): ProductionOrderSummary[] {
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

export function calcFinancialExposure(
  orders: ProductionOrderSummary[],
  partNumber: string
): FinancialSummary {
  const wipOrders = orders.filter((o) => o.status === 'IN_PROGRESS');
  const wipExposure = wipOrders.reduce((sum, o) => sum + o.estimatedValue, 0);
  const inv = INVENTORY[partNumber.toUpperCase()];
  const inventoryExposure = inv ? inv.onHandQty * inv.unitCost : 0;
  return {
    wipExposure,
    inventoryExposure: Math.round(inventoryExposure * 100) / 100,
    totalExposure: wipExposure + Math.round(inventoryExposure * 100) / 100,
    currency: 'USD',
  };
}

export function assembleImpactResult(
  sourcePart: string,
  targetPart: string | undefined,
  analysisType: string,
  affectedAssemblies: AffectedAssembly[],
  orders: ProductionOrderSummary[],
  financialSummary: FinancialSummary
): ImpactData {
  return { sourcePart, targetPart, analysisType, affectedAssemblies, productionOrders: orders, financialSummary };
}
