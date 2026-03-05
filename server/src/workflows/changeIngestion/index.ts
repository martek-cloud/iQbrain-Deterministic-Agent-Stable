import { makeStep, completeStep, uuidv4 } from '../helpers';
import type { WorkflowPlugin } from '../plugin';
import type { WorkflowResult, IntentParams } from '../../types/intents';
import { CHANGES } from '../../adapters/mock/data';

interface ChangeIngestionParams {
  sinceTimestamp?: string;
}

async function runChangeIngestionWorkflow(params: ChangeIngestionParams): Promise<WorkflowResult> {
  const startMs = Date.now();
  const executionId = uuidv4();
  const steps = [];
  const workflowType = 'closure_status_query' as const;

  const step1 = makeStep('Poll PLM for released changes');
  steps.push(step1);

  const since = params.sinceTimestamp ? new Date(params.sinceTimestamp) : new Date(0);
  const releasedChanges = Object.values(CHANGES).filter(
    (c) => c.status === 'RELEASED' && c.releasedAt && new Date(c.releasedAt) > since
  );
  steps[0] = completeStep(step1);

  const step2 = makeStep('Trigger closure init for each released change');
  steps.push(step2);

  // In production: trigger closureInit workflow for each released change
  // client.workflow.start('closureInitWorkflow', { args: [{ changeId: c.changeId }] })
  const triggerCount = releasedChanges.length;
  steps[1] = completeStep(step2);

  return {
    workflowType,
    status: 'complete',
    steps,
    data: {
      changeId: `batch-${triggerCount}`,
      overallStatus: 'PLM_RELEASED',
      erpStatus: 'NOT_STARTED',
      mesStatus: 'NOT_STARTED',
      mbomUpdatesRequired: 0,
      mbomUpdatesComplete: 0,
      ordersAffected: 0,
      ordersAligned: 0,
      lagDays: 0,
      mbomUpdateDetails: [],
      orderAlignmentDetails: [],
    },
    executionId,
    durationMs: Date.now() - startMs,
  };
}

export const changeIngestionPlugin: WorkflowPlugin = {
  intentType: 'closure_status_query',
  name: 'Change Ingestion',
  description: 'Polls PLM for newly released changes and triggers closure tracker initialization for each.',
  workflowFn: (params) => runChangeIngestionWorkflow(params as IntentParams & ChangeIngestionParams),
};
