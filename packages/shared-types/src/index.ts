// ============================================================
// IntentType — 6 active + 4 deferred stubs
// ============================================================
export type IntentType =
  | 'change_impact_analysis'
  | 'where_used_analysis'
  | 'closure_status_query'
  | 'cycle_time_single'
  | 'bom_comparison_ebom_mbom'
  | 'supply_chain_query'
  | 'change_history_query'
  | 'bom_version_compare'
  | 'part_lifecycle_query'
  | 'unknown';

// ============================================================
// ParsedIntent — discriminated union by intent type
// ============================================================
export interface ChangeImpactParams {
  sourcePart: string;
  targetPart?: string;
  analysisType?: 'full_impact' | 'financial_only' | 'where_used_only';
}

export interface WhereUsedParams {
  partNumber: string;
  includeProductionOrders?: boolean;
  maxDepth?: number;
}

export interface ClosureStatusParams {
  changeId?: string;
  showAll?: boolean;
  filterByBottleneck?: 'PLM' | 'ERP' | 'MES';
}

export interface CycleTimeSingleParams {
  changeId: string;
}

export interface BomComparisonParams {
  assemblyId: string;
  ebomRevision?: string;
  mbomRevision?: string;
}

export interface GenericIntentParams {
  rawQuery: string;
}

export type IntentParams =
  | ChangeImpactParams
  | WhereUsedParams
  | ClosureStatusParams
  | CycleTimeSingleParams
  | BomComparisonParams
  | GenericIntentParams;

export interface ParsedIntent {
  intent: IntentType;
  confidence: number;
  parameters: IntentParams;
  rawQuery: string;
}

// ============================================================
// WorkflowStatus
// ============================================================
export type WorkflowStatus = 'running' | 'complete' | 'error' | 'declined';

// ============================================================
// WorkflowStep
// ============================================================
export interface WorkflowStep {
  name: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  startedAt?: number;
  completedAt?: number;
  errorMessage?: string;
}

// ============================================================
// Workflow data shapes
// ============================================================

export interface AffectedAssembly {
  assemblyId: string;
  assemblyName: string;
  depth: number;
  isTopLevel: boolean;
}

export interface ProductionOrderSummary {
  orderId: string;
  assemblyId: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETE' | 'ON_HOLD';
  estimatedValue: number;
  currency: string;
  quantity: number;
}

export interface FinancialSummary {
  wipExposure: number;
  inventoryExposure: number;
  totalExposure: number;
  currency: string;
}

export interface ImpactData {
  sourcePart: string;
  targetPart?: string;
  affectedAssemblies: AffectedAssembly[];
  productionOrders: ProductionOrderSummary[];
  financialSummary: FinancialSummary;
  analysisType: string;
}

export interface WhereUsedNode {
  assemblyId: string;
  assemblyName: string;
  depth: number;
  isTopLevel: boolean;
  children: WhereUsedNode[];
  productionOrders?: ProductionOrderSummary[];
}

export interface WhereUsedData {
  partNumber: string;
  tree: WhereUsedNode[];
  totalAssemblies: number;
  topLevelCount: number;
  maxDepthReached: number;
}

export interface MBOMUpdateDetail {
  mbomId: string;
  assemblyId: string;
  status: 'UPDATED' | 'PENDING' | 'NOT_APPLICABLE';
  updatedAt?: string;
}

export interface OrderAlignmentDetail {
  orderId: string;
  assemblyId: string;
  status: 'ALIGNED' | 'PENDING' | 'FLAGGED';
}

export interface ClosureData {
  changeId: string;
  overallStatus: 'PLM_RELEASED' | 'ERP_PARTIAL' | 'ERP_COMPLETE' | 'MES_PARTIAL' | 'CLOSED';
  erpStatus: 'NOT_STARTED' | 'PARTIAL' | 'COMPLETE';
  mesStatus: 'NOT_STARTED' | 'PARTIAL' | 'COMPLETE';
  mbomUpdatesRequired: number;
  mbomUpdatesComplete: number;
  ordersAffected: number;
  ordersAligned: number;
  bottleneck?: 'PLM' | 'ERP' | 'MES';
  lagDays: number;
  mbomUpdateDetails: MBOMUpdateDetail[];
  orderAlignmentDetails: OrderAlignmentDetail[];
}

export interface StageMetric {
  stage: string;
  durationDays: number;
  startDate: string;
  endDate: string;
}

export interface CycleTimeData {
  changeId: string;
  totalCycleDays: number;
  longestStage: string;
  approvalCycles: number;
  stageBreakdown: StageMetric[];
  createdAt: string;
  releasedAt: string;
}

export type ReconcileCategory =
  | 'ALIGNED'
  | 'QTY_MISMATCH_EXPECTED'
  | 'QTY_MISMATCH_UNEXPECTED'
  | 'MISSING_FROM_MBOM'
  | 'MBOM_ONLY_EXPECTED'
  | 'MBOM_ONLY_UNEXPECTED'
  | 'REVISION_MISMATCH';

export interface ReconcileLine {
  partNumber: string;
  partName: string;
  ebomQty?: number;
  mbomQty?: number;
  ebomRevision?: string;
  mbomRevision?: string;
  category: ReconcileCategory;
  explanation?: string;
}

export interface ReconcileData {
  assemblyId: string;
  assemblyName: string;
  totalLines: number;
  alignedCount: number;
  divergentCount: number;
  lines: ReconcileLine[];
}

// ============================================================
// WorkflowResult — discriminated union by workflowType
// ============================================================
export type WorkflowResult =
  | { workflowType: 'change_impact_analysis'; status: WorkflowStatus; steps: WorkflowStep[]; data: ImpactData; errorMessage?: string; executionId: string; durationMs: number }
  | { workflowType: 'where_used_analysis'; status: WorkflowStatus; steps: WorkflowStep[]; data: WhereUsedData; errorMessage?: string; executionId: string; durationMs: number }
  | { workflowType: 'closure_status_query'; status: WorkflowStatus; steps: WorkflowStep[]; data: ClosureData; errorMessage?: string; executionId: string; durationMs: number }
  | { workflowType: 'cycle_time_single'; status: WorkflowStatus; steps: WorkflowStep[]; data: CycleTimeData; errorMessage?: string; executionId: string; durationMs: number }
  | { workflowType: 'bom_comparison_ebom_mbom'; status: WorkflowStatus; steps: WorkflowStep[]; data: ReconcileData; errorMessage?: string; executionId: string; durationMs: number }
  | { workflowType: 'unknown'; status: WorkflowStatus; steps: WorkflowStep[]; data: null; errorMessage?: string; executionId: string; durationMs: number };

// ============================================================
// ChatMessage
// ============================================================
export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  isStreaming?: boolean;
  intent?: ParsedIntent;
  workflowResult?: WorkflowResult;
  timestamp: number;
}

// ============================================================
// SSE event types
// ============================================================
export interface SSESessionEvent {
  type: 'session';
  sessionId: string;
}

export interface SSEStatusEvent {
  type: 'status';
  phase: 'connecting' | 'parsing' | 'routing' | 'workflow' | 'generating' | 'done';
  label: string;
  workflowName?: string;
}

export interface SSEIntentEvent {
  type: 'intent';
  intent: ParsedIntent;
}

export interface SSEWorkflowEvent {
  type: 'workflow';
  result: WorkflowResult;
}

export interface SSETokenEvent {
  type: 'token';
  token: string;
}

export interface SSEDoneEvent {
  type: 'done';
}

export interface SSEErrorEvent {
  type: 'error';
  message: string;
}

export type SSEEvent =
  | SSESessionEvent
  | SSEStatusEvent
  | SSEIntentEvent
  | SSEWorkflowEvent
  | SSETokenEvent
  | SSEDoneEvent
  | SSEErrorEvent;

// ============================================================
// Model selector
// ============================================================
export interface FreeModel {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: { prompt: string; completion: string };
  architecture?: { modality: string };
}

export const FREE_MODELS: FreeModel[] = [
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'Meta', contextWindow: 128000 },
  { id: 'google/gemma-3-27b-it', name: 'Gemma 3 27B', provider: 'Google', contextWindow: 131072 },
  { id: 'mistralai/mistral-small-3.1-24b-instruct', name: 'Mistral Small 3.1 24B', provider: 'Mistral', contextWindow: 128000 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (free)', provider: 'Meta', contextWindow: 128000 },
];
