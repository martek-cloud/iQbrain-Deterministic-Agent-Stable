import { patched, uuid4 } from '@temporalio/workflow';
import type { WorkflowResult, IntentParams } from '../types/intents';

function stubResult(workflowType: WorkflowResult['workflowType']): WorkflowResult {
  return {
    workflowType,
    status: 'complete',
    steps: [{ name: 'stub-execute', status: 'complete', completedAt: Date.now() }],
    data: null as unknown as never,
    executionId: uuid4(),
    durationMs: 50,
  };
}

// One stub per active intent type.
// Each uses patched() so versioning works when real logic is swapped in.

export async function changeImpactAnalysisWorkflow(_params: IntentParams): Promise<WorkflowResult> {
  const isV2 = patched('change-impact-v2');
  void isV2;
  return stubResult('change_impact_analysis');
}

export async function whereUsedAnalysisWorkflow(_params: IntentParams): Promise<WorkflowResult> {
  patched('where-used-v1');
  return stubResult('where_used_analysis');
}

export async function closureStatusQueryWorkflow(_params: IntentParams): Promise<WorkflowResult> {
  patched('closure-query-v1');
  return stubResult('closure_status_query');
}

export async function cycleTimeSingleWorkflow(_params: IntentParams): Promise<WorkflowResult> {
  patched('cycle-time-v1');
  return stubResult('cycle_time_single');
}

export async function bomComparisonEbomMbomWorkflow(_params: IntentParams): Promise<WorkflowResult> {
  patched('bom-compare-v1');
  return stubResult('bom_comparison_ebom_mbom');
}

// Stubs for deferred intent types
export async function supplyChainQueryWorkflow(_params: IntentParams): Promise<WorkflowResult> {
  return stubResult('unknown');
}

export async function changeHistoryQueryWorkflow(_params: IntentParams): Promise<WorkflowResult> {
  return stubResult('unknown');
}

export async function bomVersionCompareWorkflow(_params: IntentParams): Promise<WorkflowResult> {
  return stubResult('unknown');
}

export async function partLifecycleQueryWorkflow(_params: IntentParams): Promise<WorkflowResult> {
  return stubResult('unknown');
}
