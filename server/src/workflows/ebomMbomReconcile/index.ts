import { makeStep, completeStep, errorResult, uuidv4 } from '../helpers';
import type { WorkflowPlugin } from '../plugin';
import type { WorkflowResult, BomComparisonParams } from '../../types/intents';
import { ASSEMBLIES } from '../../adapters/mock/data';
import { fetchEBOM, fetchMBOM, reconcile } from './activities';

async function runEbomMbomReconcileWorkflow(params: BomComparisonParams): Promise<WorkflowResult> {
  const startMs = Date.now();
  const executionId = uuidv4();
  const steps = [];
  const workflowType = 'bom_comparison_ebom_mbom' as const;

  // Step 1: Fetch EBOM
  const step1 = makeStep('Fetch EBOM');
  steps.push(step1);
  const ebom = fetchEBOM(params.assemblyId);
  if (!ebom) {
    steps[0] = { ...step1, status: 'error' as const };
    return errorResult(workflowType, executionId, startMs, steps, `Assembly "${params.assemblyId}" not found in PLM`);
  }
  steps[0] = completeStep(step1);

  // Step 2: Fetch MBOM
  const step2 = makeStep('Fetch MBOM');
  steps.push(step2);
  const mbom = fetchMBOM(params.assemblyId);
  if (!mbom) {
    steps[1] = { ...step2, status: 'error' as const };
    return errorResult(workflowType, executionId, startMs, steps, `No MBOM found for assembly "${params.assemblyId}"`);
  }
  steps[1] = completeStep(step2);

  // Step 3: Reconcile
  const step3 = makeStep('Reconcile EBOM vs MBOM');
  steps.push(step3);
  const lines = reconcile(params.assemblyId, ebom, mbom);
  steps[2] = completeStep(step3);

  const alignedCount = lines.filter((l) => l.category === 'ALIGNED').length;
  const divergentCount = lines.length - alignedCount;
  const assembly = ASSEMBLIES[params.assemblyId.toUpperCase()];

  return {
    workflowType,
    status: 'complete',
    steps,
    data: {
      assemblyId: params.assemblyId,
      assemblyName: assembly?.name ?? params.assemblyId,
      totalLines: lines.length,
      alignedCount,
      divergentCount,
      lines,
    },
    executionId,
    durationMs: Date.now() - startMs,
  };
}

export const ebomMbomReconcilePlugin: WorkflowPlugin = {
  intentType: 'bom_comparison_ebom_mbom',
  name: 'EBOM/MBOM Reconciliation',
  description: 'Compares the Engineering BOM and Manufacturing BOM for an assembly, classifying each divergence.',
  workflowFn: (params) => runEbomMbomReconcileWorkflow(params as BomComparisonParams),
};
