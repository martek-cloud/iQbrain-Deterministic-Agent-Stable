import { makeStep, completeStep, errorResult, uuidv4 } from '../helpers';
import type { WorkflowPlugin } from '../plugin';
import type { WorkflowResult, ClosureStatusParams, ClosureData } from '../../types/intents';
import { getTrackerById, getAllOpenTrackers, filterByBottleneck } from './activities';

function trackerToClosureData(t: ReturnType<typeof getTrackerById>): ClosureData | null {
  if (!t) return null;
  return {
    changeId: t.changeId,
    overallStatus: t.overallStatus,
    erpStatus: t.erpStatus,
    mesStatus: t.mesStatus,
    mbomUpdatesRequired: t.mbomUpdatesRequired,
    mbomUpdatesComplete: t.mbomUpdatesComplete,
    ordersAffected: t.ordersAffected,
    ordersAligned: t.ordersAligned,
    bottleneck: t.bottleneck,
    lagDays: t.lagDays,
    mbomUpdateDetails: t.mbomUpdateDetails,
    orderAlignmentDetails: t.orderAlignmentDetails,
  };
}

async function runClosureQueryWorkflow(params: ClosureStatusParams): Promise<WorkflowResult> {
  const startMs = Date.now();
  const executionId = uuidv4();
  const steps = [];
  const workflowType = 'closure_status_query' as const;

  const step1 = makeStep('Query closure tracker');
  steps.push(step1);

  let closureData: ClosureData | null = null;

  if (params.changeId) {
    const tracker = getTrackerById(params.changeId);
    if (!tracker) {
      steps[0] = { ...step1, status: 'error' as const };
      return errorResult(workflowType, executionId, startMs, steps, `No closure tracker found for ${params.changeId}`);
    }
    closureData = trackerToClosureData(tracker);
  } else if (params.showAll) {
    let trackers = getAllOpenTrackers();
    if (params.filterByBottleneck) {
      trackers = filterByBottleneck(trackers, params.filterByBottleneck);
    }
    // Return first tracker for now; real implementation would return list
    closureData = trackers.length > 0 ? trackerToClosureData(trackers[0]) : null;
  }

  steps[0] = completeStep(step1);

  if (!closureData) {
    return errorResult(workflowType, executionId, startMs, steps, 'No closure data found');
  }

  return {
    workflowType,
    status: 'complete',
    steps,
    data: closureData,
    executionId,
    durationMs: Date.now() - startMs,
  };
}

export const closureQueryPlugin: WorkflowPlugin = {
  intentType: 'closure_status_query',
  name: 'Closure Status Query',
  description: 'Returns the current closure status of a change order across PLM, ERP, and MES systems.',
  workflowFn: (params) => runClosureQueryWorkflow(params as ClosureStatusParams),
};
