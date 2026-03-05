import { makeStep, completeStep, errorResult, uuidv4 } from '../helpers';
import type { WorkflowPlugin } from '../plugin';
import type { WorkflowResult, WhereUsedParams } from '../../types/intents';
import {
  resolvePartIdentity,
  recursiveWhereUsed,
  flattenTree,
  optionalProductionOrderBranch,
} from './activities';

async function runWhereUsedWorkflow(params: WhereUsedParams): Promise<WorkflowResult> {
  const startMs = Date.now();
  const executionId = uuidv4();
  const steps = [];
  const workflowType = 'where_used_analysis' as const;
  const maxDepth = params.maxDepth ?? 10;

  // Step 1: Resolve identity
  const step1 = makeStep('Resolve part identity');
  steps.push(step1);
  const canonicalId = resolvePartIdentity(params.partNumber);
  if (!canonicalId) {
    steps[0] = { ...step1, status: 'error' as const, errorMessage: `Part ${params.partNumber} not found` };
    return errorResult(workflowType, executionId, startMs, steps, `Part "${params.partNumber}" not found`);
  }
  steps[0] = completeStep(step1);

  // Step 2: Recursive where-used
  const step2 = makeStep('Recursive where-used traversal');
  steps.push(step2);
  const tree = recursiveWhereUsed(canonicalId, new Set(), 0, maxDepth);
  const flat = flattenTree(tree);
  const topLevelCount = flat.filter((n) => n.isTopLevel).length;
  const maxDepthReached = flat.length > 0 ? Math.max(...flat.map((n) => n.depth)) : 0;
  steps[1] = completeStep(step2);

  // Step 3 (optional): Production orders
  const step3 = makeStep('Fetch production orders');
  steps.push(step3);
  if (params.includeProductionOrders) {
    const assemblyIds = flat.map((n) => n.assemblyId);
    const orders = optionalProductionOrderBranch(assemblyIds);
    for (const node of flat) {
      node.productionOrders = orders.filter((o) => o.assemblyId === node.assemblyId);
    }
  }
  steps[2] = completeStep(step3);

  return {
    workflowType,
    status: 'complete',
    steps,
    data: {
      partNumber: params.partNumber,
      tree,
      totalAssemblies: flat.length,
      topLevelCount,
      maxDepthReached,
    },
    executionId,
    durationMs: Date.now() - startMs,
  };
}

export const whereUsedPlugin: WorkflowPlugin = {
  intentType: 'where_used_analysis',
  name: 'Where-Used Analysis',
  description: 'Finds all assemblies that use a given part, traversing the BOM tree upward.',
  workflowFn: (params) => runWhereUsedWorkflow(params as WhereUsedParams),
};
