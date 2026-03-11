import { makeStep, completeStep, uuidv4 } from '../helpers';
import type { WorkflowPlugin } from '../plugin';
import type { WorkflowResult, IntentParams } from '../../types/intents';
import type { ChangeClosureTracker } from '../../types/canonical';
import {
  CHANGES,
  ASSEMBLIES,
  RELATIONSHIPS,
  PRODUCTION_ORDERS,
  CLOSURE_TRACKERS,
} from '../../adapters/data';

interface ClosureInitParams {
  changeId: string;
}

async function runClosureInitWorkflow(params: ClosureInitParams): Promise<WorkflowResult> {
  const startMs = Date.now();
  const executionId = uuidv4();
  const steps = [];
  const workflowType = 'closure_status_query' as const;

  const step1 = makeStep('Validate change exists');
  steps.push(step1);
  const change = CHANGES[params.changeId.toUpperCase()];
  if (!change) {
    steps[0] = { ...step1, status: 'error' as const };
    return {
      workflowType,
      status: 'error',
      steps,
      data: null as unknown as never,
      executionId,
      durationMs: Date.now() - startMs,
      errorMessage: `Change "${params.changeId}" not found`,
    };
  }
  steps[0] = completeStep(step1);

  const step2 = makeStep('Compute affected assemblies');
  steps.push(step2);
  const affectedRels = RELATIONSHIPS.filter(
    (r) => r.fromId === change.canonicalId && r.type === 'AFFECTS'
  );
  const affectedAssemblyIds = affectedRels
    .map((r) => Object.values(ASSEMBLIES).find((a) => a.canonicalId === r.toId))
    .filter(Boolean)
    .map((a) => a!.assemblyId);
  steps[1] = completeStep(step2);

  const step3 = makeStep('Compute MBOM updates required');
  steps.push(step3);
  const mbomUpdatesRequired = affectedAssemblyIds.length;
  steps[2] = completeStep(step3);

  const step4 = makeStep('Compute production orders affected');
  steps.push(step4);
  const ordersAffected = Object.values(PRODUCTION_ORDERS).filter((po) =>
    affectedAssemblyIds.includes(po.assemblyId)
  ).length;
  steps[3] = completeStep(step4);

  const step5 = makeStep('Initialize tracker');
  steps.push(step5);

  // Initialize tracker (in a real system, this persists to ERP)
  const tracker: ChangeClosureTracker = {
    canonicalId: `iqb:tracker:${change.changeId.toLowerCase()}`,
    changeId: change.changeId,
    overallStatus: 'PLM_RELEASED',
    erpStatus: 'NOT_STARTED',
    mesStatus: 'NOT_STARTED',
    mbomUpdatesRequired,
    mbomUpdatesComplete: 0,
    ordersAffected,
    ordersAligned: 0,
    lagDays: 0,
    mbomUpdateDetails: affectedAssemblyIds.map((assemblyId, i) => ({
      mbomId: `MBOM-INIT-${i + 1}`,
      assemblyId,
      status: 'PENDING' as const,
    })),
    orderAlignmentDetails: Object.values(PRODUCTION_ORDERS)
      .filter((po) => affectedAssemblyIds.includes(po.assemblyId))
      .map((po) => ({ orderId: po.orderId, assemblyId: po.assemblyId, status: 'PENDING' as const })),
    startedAt: new Date().toISOString(),
    lastCheckedAt: new Date().toISOString(),
  };

  // Persist to in-memory store
  CLOSURE_TRACKERS[change.changeId.toUpperCase()] = tracker;
  steps[4] = completeStep(step5);

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
      lagDays: 0,
      mbomUpdateDetails: tracker.mbomUpdateDetails,
      orderAlignmentDetails: tracker.orderAlignmentDetails,
    },
    executionId,
    durationMs: Date.now() - startMs,
  };
}

export const closureInitPlugin: WorkflowPlugin = {
  intentType: 'closure_status_query',
  name: 'Closure Tracker Initialization',
  description: 'Initializes a closure tracker for a newly released change, mapping required MBOM updates and production orders.',
  workflowFn: (params) => runClosureInitWorkflow(params as IntentParams & ClosureInitParams),
};
