import { makeStep, completeStep, errorResult, uuidv4 } from '../helpers';
import type { WorkflowPlugin } from '../plugin';
import type { WorkflowResult, CycleTimeSingleParams } from '../../types/intents';
import { getChange, computeMetrics } from './activities';

async function runCycleTimeSingleWorkflow(params: CycleTimeSingleParams): Promise<WorkflowResult> {
  const startMs = Date.now();
  const executionId = uuidv4();
  const steps = [];
  const workflowType = 'cycle_time_single' as const;

  const step1 = makeStep('Fetch change record');
  steps.push(step1);
  const change = getChange(params.changeId);
  if (!change) {
    steps[0] = { ...step1, status: 'error' as const };
    return errorResult(workflowType, executionId, startMs, steps, `Change "${params.changeId}" not found`);
  }
  steps[0] = completeStep(step1);

  const step2 = makeStep('Compute cycle time metrics');
  steps.push(step2);
  const data = computeMetrics(change);
  steps[1] = completeStep(step2);

  return {
    workflowType,
    status: 'complete',
    steps,
    data,
    executionId,
    durationMs: Date.now() - startMs,
  };
}

export const cycleTimeSinglePlugin: WorkflowPlugin = {
  intentType: 'cycle_time_single',
  name: 'Cycle Time Single',
  description: 'Computes cycle time metrics for a single change order from creation to release.',
  workflowFn: (params) => runCycleTimeSingleWorkflow(params as CycleTimeSingleParams),
};
