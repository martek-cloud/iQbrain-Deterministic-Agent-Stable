import { makeStep, completeStep, uuidv4 } from '../helpers';
import type { WorkflowPlugin } from '../plugin';
import type { WorkflowResult, IntentParams } from '../../types/intents';
import { CLOSURE_TRACKERS, MBOM_MAPPINGS, PRODUCTION_ORDERS } from '../../adapters/data';

// MONITORING_INTERVAL_HOURS: set to 0.01 for local dev (~36s), default 24 for prod
const MONITORING_INTERVAL_HOURS = parseFloat(process.env.MONITORING_INTERVAL_HOURS ?? '24');

interface ClosureMonitorParams {
  changeId: string;
  maxIterations?: number;
}

async function runClosureMonitorWorkflow(params: ClosureMonitorParams): Promise<WorkflowResult> {
  const startMs = Date.now();
  const executionId = uuidv4();
  const steps = [];
  const workflowType = 'closure_status_query' as const;
  const maxIter = params.maxIterations ?? 1;

  const step1 = makeStep('Fetch closure tracker');
  steps.push(step1);
  let tracker = CLOSURE_TRACKERS[params.changeId.toUpperCase()];
  if (!tracker) {
    steps[0] = { ...step1, status: 'error' as const };
    return {
      workflowType,
      status: 'error',
      steps,
      data: null as unknown as never,
      executionId,
      durationMs: Date.now() - startMs,
      errorMessage: `No tracker for change "${params.changeId}"`,
    };
  }
  steps[0] = completeStep(step1);

  // Long-running monitoring loop (simulate Temporal workflow.sleep pattern)
  // In production: use workflow.sleep(MONITORING_INTERVAL_HOURS * 3600 * 1000) between iterations
  for (let i = 0; i < maxIter; i++) {
    const step = makeStep(`Check iteration ${i + 1}`);
    steps.push(step);

    // Simulate progress: check ERP MBOM updates
    const mbomUpdates = Object.values(MBOM_MAPPINGS).filter(
      (m) => tracker.mbomUpdateDetails.some((d) => d.mbomId === m.mbomId && m.changeId === params.changeId)
    );
    const updatedMbomCount = mbomUpdates.length;

    // Check production order alignment
    const alignedOrders = tracker.orderAlignmentDetails.filter((od) => {
      const po = PRODUCTION_ORDERS[od.orderId.toUpperCase()];
      return po && po.status === 'COMPLETE';
    }).length;

    // Update tracker state
    tracker.mbomUpdatesComplete = updatedMbomCount;
    tracker.ordersAligned = alignedOrders;
    tracker.lagDays = Math.floor((Date.now() - new Date(tracker.startedAt).getTime()) / (1000 * 60 * 60 * 24));
    tracker.lastCheckedAt = new Date().toISOString();

    // Determine bottleneck
    if (tracker.erpStatus === 'NOT_STARTED' || tracker.erpStatus === 'PARTIAL') {
      tracker.bottleneck = 'ERP';
    } else if (tracker.mesStatus === 'NOT_STARTED' || tracker.mesStatus === 'PARTIAL') {
      tracker.bottleneck = 'MES';
    } else {
      tracker.bottleneck = undefined;
    }

    // Determine overall status
    if (tracker.mbomUpdatesComplete >= tracker.mbomUpdatesRequired) {
      tracker.erpStatus = 'COMPLETE';
    } else if (tracker.mbomUpdatesComplete > 0) {
      tracker.erpStatus = 'PARTIAL';
    }

    if (tracker.ordersAligned >= tracker.ordersAffected) {
      tracker.mesStatus = 'COMPLETE';
    }

    if (tracker.erpStatus === 'COMPLETE' && tracker.mesStatus === 'COMPLETE') {
      tracker.overallStatus = 'CLOSED';
    }

    const stepCompleted = completeStep(step);
    steps[steps.length - 1] = stepCompleted;

    // Simulate sleep (in production this is workflow.sleep)
    void MONITORING_INTERVAL_HOURS;
  }

  return {
    workflowType,
    status: 'complete',
    steps,
    data: {
      changeId: tracker.changeId,
      overallStatus: tracker.overallStatus,
      erpStatus: tracker.erpStatus,
      mesStatus: tracker.mesStatus,
      mbomUpdatesRequired: tracker.mbomUpdatesRequired,
      mbomUpdatesComplete: tracker.mbomUpdatesComplete,
      ordersAffected: tracker.ordersAffected,
      ordersAligned: tracker.ordersAligned,
      bottleneck: tracker.bottleneck,
      lagDays: tracker.lagDays,
      mbomUpdateDetails: tracker.mbomUpdateDetails,
      orderAlignmentDetails: tracker.orderAlignmentDetails,
    },
    executionId,
    durationMs: Date.now() - startMs,
  };
}

export const closureMonitorPlugin: WorkflowPlugin = {
  intentType: 'closure_status_query',
  name: 'Closure Monitoring',
  description: 'Long-running workflow that polls ERP/MES to track change closure progress across MBOM updates and production orders.',
  workflowFn: (params) => runClosureMonitorWorkflow(params as IntentParams & ClosureMonitorParams),
};
