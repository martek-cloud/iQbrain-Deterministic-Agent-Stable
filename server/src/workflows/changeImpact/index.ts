import { makeStep, completeStep, errorResult, uuidv4 } from '../helpers';
import type { WorkflowPlugin } from '../plugin';
import type { WorkflowResult, ChangeImpactParams } from '../../types/intents';
import {
  resolveIdentity,
  traverseWhereUsed,
  getProductionOrdersForAssemblies,
  calcFinancialExposure,
  assembleImpactResult,
} from './activities';

async function runChangeImpactWorkflow(params: ChangeImpactParams): Promise<WorkflowResult> {
  const startMs = Date.now();
  const executionId = uuidv4();
  const steps = [];
  const workflowType = 'change_impact_analysis' as const;

  // Step 1: Resolve identity
  const step1 = makeStep('Resolve part identity');
  steps.push(step1);
  const canonicalId = resolveIdentity(params.sourcePart);
  if (!canonicalId) {
    steps[0] = { ...step1, status: 'error' as const, errorMessage: `Part ${params.sourcePart} not found` };
    return errorResult(workflowType, executionId, startMs, steps, `Part "${params.sourcePart}" not found in PLM`);
  }
  steps[0] = completeStep(step1);

  // Step 2: Traverse where-used
  const step2 = makeStep('Traverse where-used');
  steps.push(step2);
  const affectedAssemblies = traverseWhereUsed(canonicalId);
  steps[1] = completeStep(step2);

  // Step 3: Get production orders
  const step3 = makeStep('Fetch production orders');
  steps.push(step3);
  const assemblyIds = affectedAssemblies.map((a) => a.assemblyId);
  const orders = getProductionOrdersForAssemblies(assemblyIds);
  steps[2] = completeStep(step3);

  // Step 4: Inventory
  const step4 = makeStep('Fetch inventory');
  steps.push(step4);
  steps[3] = completeStep(step4);

  // Step 5: Financial exposure
  const step5 = makeStep('Calculate financial exposure');
  steps.push(step5);
  const financial = calcFinancialExposure(orders, params.sourcePart);
  steps[4] = completeStep(step5);

  const data = assembleImpactResult(
    params.sourcePart,
    params.targetPart,
    params.analysisType ?? 'full_impact',
    affectedAssemblies,
    orders,
    financial
  );

  return {
    workflowType,
    status: 'complete',
    steps,
    data,
    executionId,
    durationMs: Date.now() - startMs,
  };
}

export const changeImpactPlugin: WorkflowPlugin = {
  intentType: 'change_impact_analysis',
  name: 'Change Impact Analysis',
  description: 'Analyses the impact of replacing or modifying a part across the BOM tree, production orders, and financial exposure.',
  workflowFn: (params) => runChangeImpactWorkflow(params as ChangeImpactParams),
};
