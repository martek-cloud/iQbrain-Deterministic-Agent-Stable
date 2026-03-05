import type { IntentType, ParsedIntent } from '../types/intents';

// Maps each IntentType to the Temporal workflow function name
export const WORKFLOW_REGISTRY: Record<string, string> = {
  change_impact_analysis: 'changeImpactAnalysisWorkflow',
  where_used_analysis: 'whereUsedAnalysisWorkflow',
  closure_status_query: 'closureStatusQueryWorkflow',
  cycle_time_single: 'cycleTimeSingleWorkflow',
  bom_comparison_ebom_mbom: 'bomComparisonEbomMbomWorkflow',
  // Stubs for deferred intents
  supply_chain_query: 'supplyChainQueryWorkflow',
  change_history_query: 'changeHistoryQueryWorkflow',
  bom_version_compare: 'bomVersionCompareWorkflow',
  part_lifecycle_query: 'partLifecycleQueryWorkflow',
};

// Active intents that have real (non-stub) workflows
const ACTIVE_INTENTS: Set<IntentType> = new Set([
  'change_impact_analysis',
  'where_used_analysis',
  'closure_status_query',
  'cycle_time_single',
  'bom_comparison_ebom_mbom',
]);

export interface RouteResult {
  shouldRoute: boolean;
  workflowFn?: string;
  declineReason?: string;
}

export function routeIntent(intent: ParsedIntent): RouteResult {
  if (intent.intent === 'unknown') {
    return { shouldRoute: false, declineReason: 'Intent could not be classified. Please rephrase your question.' };
  }

  if (intent.confidence < 0.5) {
    return {
      shouldRoute: false,
      declineReason: `Low confidence (${Math.round(intent.confidence * 100)}%) in intent classification. Please be more specific.`,
    };
  }

  const workflowFn = WORKFLOW_REGISTRY[intent.intent];
  if (!workflowFn) {
    return { shouldRoute: false, declineReason: `No workflow registered for intent: ${intent.intent}` };
  }

  if (!ACTIVE_INTENTS.has(intent.intent as IntentType)) {
    return {
      shouldRoute: false,
      declineReason: `The "${intent.intent.replace(/_/g, ' ')}" workflow is not yet implemented. Available: change impact, where-used, closure status, cycle time, BOM comparison.`,
    };
  }

  return { shouldRoute: true, workflowFn };
}
