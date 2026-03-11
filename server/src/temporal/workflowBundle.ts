/**
 * Temporal workflow bundle entry point.
 * All functions exported here are registered with the worker.
 * Must be fully deterministic: no Date.now(), no uuid, no direct I/O.
 * All non-deterministic work is delegated to activities via proxyActivities.
 */
import { proxyActivities, uuid4 } from '@temporalio/workflow';
import type * as AllActivities from './activities';
import type {
  WorkflowResult,
  IntentParams,
  ChangeImpactParams,
  WhereUsedParams,
  ClosureStatusParams,
  CycleTimeSingleParams,
  BomComparisonParams,
  WorkflowStep,
} from '../types/intents';

const {
  resolveIdentity,
  traverseWhereUsed,
  getProductionOrdersForAssemblies,
  calcFinancialExposure,
  assembleImpactResult,
  resolvePartIdentity,
  recursiveWhereUsed,
  flattenTree,
  optionalProductionOrderBranch,
  getTrackerById,
  getAllOpenTrackers,
  filterByBottleneck,
  getChange,
  computeMetrics,
  fetchEBOM,
  fetchMBOM,
  reconcile,
} = proxyActivities<typeof AllActivities>({
  startToCloseTimeout: '30 seconds',
});

// ─── helpers (deterministic versions) ────────────────────────────────────────

function makeStep(name: string): WorkflowStep {
  return { name, status: 'running' };
}

function completeStep(step: WorkflowStep): WorkflowStep {
  return { ...step, status: 'complete' };
}

function errorResult(
  workflowType: WorkflowResult['workflowType'],
  executionId: string,
  steps: WorkflowStep[],
  message: string
): WorkflowResult {
  return {
    workflowType,
    status: 'error',
    steps,
    data: null as unknown as never,
    executionId,
    durationMs: 0,
    errorMessage: message,
  };
}

// ─── Change Impact Analysis ───────────────────────────────────────────────────

export async function changeImpactAnalysisWorkflow(params: IntentParams): Promise<WorkflowResult> {
  const p = params as ChangeImpactParams;
  const executionId = uuid4();
  const workflowType = 'change_impact_analysis' as const;
  const steps: WorkflowStep[] = [];

  const step1 = makeStep('Resolve part identity');
  steps.push(step1);
  const canonicalId = await resolveIdentity(p.sourcePart);
  if (!canonicalId) {
    steps[0] = { ...step1, status: 'error', errorMessage: `Part ${p.sourcePart} not found` };
    return errorResult(workflowType, executionId, steps, `Part "${p.sourcePart}" not found in PLM`);
  }
  steps[0] = completeStep(step1);

  const step2 = makeStep('Traverse where-used');
  steps.push(step2);
  const affectedAssemblies = await traverseWhereUsed(canonicalId);
  steps[1] = completeStep(step2);

  const step3 = makeStep('Fetch production orders');
  steps.push(step3);
  const assemblyIds = affectedAssemblies.map((a) => a.assemblyId);
  const orders = await getProductionOrdersForAssemblies(assemblyIds);
  steps[2] = completeStep(step3);

  const step4 = makeStep('Fetch inventory');
  steps.push(step4);
  steps[3] = completeStep(step4);

  const step5 = makeStep('Calculate financial exposure');
  steps.push(step5);
  const financial = await calcFinancialExposure(orders, p.sourcePart);
  steps[4] = completeStep(step5);

  const data = await assembleImpactResult(
    p.sourcePart,
    p.targetPart,
    p.analysisType ?? 'full_impact',
    affectedAssemblies,
    orders,
    financial
  );

  return { workflowType, status: 'complete', steps, data, executionId, durationMs: 0 };
}

// ─── Where-Used Analysis ──────────────────────────────────────────────────────

export async function whereUsedAnalysisWorkflow(params: IntentParams): Promise<WorkflowResult> {
  const p = params as WhereUsedParams;
  const executionId = uuid4();
  const workflowType = 'where_used_analysis' as const;
  const steps: WorkflowStep[] = [];
  const maxDepth = p.maxDepth ?? 10;

  const step1 = makeStep('Resolve part identity');
  steps.push(step1);
  const canonicalId = await resolvePartIdentity(p.partNumber);
  if (!canonicalId) {
    steps[0] = { ...step1, status: 'error', errorMessage: `Part ${p.partNumber} not found` };
    return errorResult(workflowType, executionId, steps, `Part "${p.partNumber}" not found`);
  }
  steps[0] = completeStep(step1);

  const step2 = makeStep('Recursive where-used traversal');
  steps.push(step2);
  const tree = await recursiveWhereUsed(canonicalId, new Set(), 0, maxDepth);
  const flat = await flattenTree(tree);
  const topLevelCount = flat.filter((n) => n.isTopLevel).length;
  const maxDepthReached = flat.length > 0 ? Math.max(...flat.map((n) => n.depth)) : 0;
  steps[1] = completeStep(step2);

  const step3 = makeStep('Fetch production orders');
  steps.push(step3);
  if (p.includeProductionOrders) {
    const assemblyIds = flat.map((n) => n.assemblyId);
    const orders = await optionalProductionOrderBranch(assemblyIds);
    for (const node of flat) {
      node.productionOrders = orders.filter((o) => o.assemblyId === node.assemblyId);
    }
  }
  steps[2] = completeStep(step3);

  return {
    workflowType,
    status: 'complete',
    steps,
    data: { partNumber: p.partNumber, tree, totalAssemblies: flat.length, topLevelCount, maxDepthReached },
    executionId,
    durationMs: 0,
  };
}

// ─── Closure Status Query ─────────────────────────────────────────────────────

export async function closureStatusQueryWorkflow(params: IntentParams): Promise<WorkflowResult> {
  const p = params as ClosureStatusParams;
  const executionId = uuid4();
  const workflowType = 'closure_status_query' as const;
  const steps: WorkflowStep[] = [];

  const step1 = makeStep('Query closure tracker');
  steps.push(step1);

  type ClosureData = WorkflowResult & { workflowType: 'closure_status_query' };

  let closureData: ClosureData['data'] | null = null;

  if (p.changeId) {
    const tracker = await getTrackerById(p.changeId);
    if (!tracker) {
      steps[0] = { ...step1, status: 'error' };
      return errorResult(workflowType, executionId, steps, `No closure tracker found for ${p.changeId}`);
    }
    closureData = {
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
    };
  } else if (p.showAll) {
    let trackers = await getAllOpenTrackers();
    if (p.filterByBottleneck) {
      trackers = await filterByBottleneck(trackers, p.filterByBottleneck);
    }
    const first = trackers[0];
    if (first) {
      closureData = {
        changeId: first.changeId,
        overallStatus: first.overallStatus,
        erpStatus: first.erpStatus,
        mesStatus: first.mesStatus,
        mbomUpdatesRequired: first.mbomUpdatesRequired,
        mbomUpdatesComplete: first.mbomUpdatesComplete,
        ordersAffected: first.ordersAffected,
        ordersAligned: first.ordersAligned,
        bottleneck: first.bottleneck,
        lagDays: first.lagDays,
        mbomUpdateDetails: first.mbomUpdateDetails,
        orderAlignmentDetails: first.orderAlignmentDetails,
      };
    }
  }

  steps[0] = completeStep(step1);

  if (!closureData) {
    return errorResult(workflowType, executionId, steps, 'No closure data found');
  }

  return { workflowType, status: 'complete', steps, data: closureData, executionId, durationMs: 0 };
}

// ─── Cycle Time Single ────────────────────────────────────────────────────────

export async function cycleTimeSingleWorkflow(params: IntentParams): Promise<WorkflowResult> {
  const p = params as CycleTimeSingleParams;
  const executionId = uuid4();
  const workflowType = 'cycle_time_single' as const;
  const steps: WorkflowStep[] = [];

  const step1 = makeStep('Fetch change record');
  steps.push(step1);
  const change = await getChange(p.changeId);
  if (!change) {
    steps[0] = { ...step1, status: 'error' };
    return errorResult(workflowType, executionId, steps, `Change "${p.changeId}" not found`);
  }
  steps[0] = completeStep(step1);

  const step2 = makeStep('Compute cycle time metrics');
  steps.push(step2);
  const data = await computeMetrics(change);
  steps[1] = completeStep(step2);

  return { workflowType, status: 'complete', steps, data, executionId, durationMs: 0 };
}

// ─── EBOM/MBOM Reconciliation ─────────────────────────────────────────────────

export async function bomComparisonEbomMbomWorkflow(params: IntentParams): Promise<WorkflowResult> {
  const p = params as BomComparisonParams;
  const executionId = uuid4();
  const workflowType = 'bom_comparison_ebom_mbom' as const;
  const steps: WorkflowStep[] = [];

  const step1 = makeStep('Fetch EBOM');
  steps.push(step1);
  const ebom = await fetchEBOM(p.assemblyId);
  if (!ebom) {
    steps[0] = { ...step1, status: 'error' };
    return errorResult(workflowType, executionId, steps, `Assembly "${p.assemblyId}" not found in PLM`);
  }
  steps[0] = completeStep(step1);

  const step2 = makeStep('Fetch MBOM');
  steps.push(step2);
  const mbom = await fetchMBOM(p.assemblyId);
  if (!mbom) {
    steps[1] = { ...step2, status: 'error' };
    return errorResult(workflowType, executionId, steps, `No MBOM found for assembly "${p.assemblyId}"`);
  }
  steps[1] = completeStep(step2);

  const step3 = makeStep('Reconcile EBOM vs MBOM');
  steps.push(step3);
  const lines = await reconcile(p.assemblyId, ebom, mbom);
  steps[2] = completeStep(step3);

  const alignedCount = lines.filter((l) => l.category === 'ALIGNED').length;
  const divergentCount = lines.length - alignedCount;

  return {
    workflowType,
    status: 'complete',
    steps,
    data: {
      assemblyId: p.assemblyId,
      assemblyName: p.assemblyId,
      totalLines: lines.length,
      alignedCount,
      divergentCount,
      lines,
    },
    executionId,
    durationMs: 0,
  };
}

// ─── Deferred / stub workflows ────────────────────────────────────────────────

export async function supplyChainQueryWorkflow(_params: IntentParams): Promise<WorkflowResult> {
  return { workflowType: 'unknown', status: 'declined', steps: [], data: null as unknown as never, executionId: uuid4(), durationMs: 0 };
}

export async function changeHistoryQueryWorkflow(_params: IntentParams): Promise<WorkflowResult> {
  return { workflowType: 'unknown', status: 'declined', steps: [], data: null as unknown as never, executionId: uuid4(), durationMs: 0 };
}

export async function bomVersionCompareWorkflow(_params: IntentParams): Promise<WorkflowResult> {
  return { workflowType: 'unknown', status: 'declined', steps: [], data: null as unknown as never, executionId: uuid4(), durationMs: 0 };
}

export async function partLifecycleQueryWorkflow(_params: IntentParams): Promise<WorkflowResult> {
  return { workflowType: 'unknown', status: 'declined', steps: [], data: null as unknown as never, executionId: uuid4(), durationMs: 0 };
}
