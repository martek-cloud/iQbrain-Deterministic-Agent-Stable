import type {
  SSEEvent,
  WorkflowResult,
  ParsedIntent,
  ImpactData,
  WhereUsedData,
  ClosureData,
  CycleTimeData,
  ReconcileData,
} from '@iqbrain/shared-types';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// ---- Mock data per workflow type ----

const mockImpactData: ImpactData = {
  sourcePart: 'R245',
  targetPart: 'R250',
  affectedAssemblies: [
    { assemblyId: 'MOTOR-CTRL-V2', assemblyName: 'Motor Controller V2', depth: 1, isTopLevel: false },
    { assemblyId: 'DRIVE-UNIT-X1', assemblyName: 'Drive Unit X1', depth: 2, isTopLevel: true },
  ],
  productionOrders: [
    { orderId: 'PO-88712', assemblyId: 'MOTOR-CTRL-V2', status: 'IN_PROGRESS', estimatedValue: 185000, currency: 'USD', quantity: 24 },
    { orderId: 'PO-88841', assemblyId: 'DRIVE-UNIT-X1', status: 'PLANNED', estimatedValue: 111000, currency: 'USD', quantity: 12 },
  ],
  financialSummary: { wipExposure: 185000, inventoryExposure: 38000, totalExposure: 223000, currency: 'USD' },
  analysisType: 'full_impact',
};

const mockWhereUsedData: WhereUsedData = {
  partNumber: 'R245',
  tree: [
    {
      assemblyId: 'MOTOR-CTRL-V2',
      assemblyName: 'Motor Controller V2',
      depth: 1,
      isTopLevel: false,
      children: [
        {
          assemblyId: 'DRIVE-UNIT-X1',
          assemblyName: 'Drive Unit X1',
          depth: 2,
          isTopLevel: true,
          children: [],
        },
      ],
    },
  ],
  totalAssemblies: 2,
  topLevelCount: 1,
  maxDepthReached: 2,
};

const mockClosureData: ClosureData = {
  changeId: 'ECR-2221',
  overallStatus: 'ERP_PARTIAL',
  erpStatus: 'PARTIAL',
  mesStatus: 'NOT_STARTED',
  mbomUpdatesRequired: 3,
  mbomUpdatesComplete: 1,
  ordersAffected: 2,
  ordersAligned: 0,
  bottleneck: 'ERP',
  lagDays: 4,
  mbomUpdateDetails: [
    { mbomId: 'MBOM-001', assemblyId: 'MOTOR-CTRL-V2', status: 'UPDATED', updatedAt: '2026-02-28T10:00:00Z' },
    { mbomId: 'MBOM-002', assemblyId: 'DRIVE-UNIT-X1', status: 'PENDING' },
    { mbomId: 'MBOM-003', assemblyId: 'DRIVE-UNIT-X1-SUB', status: 'PENDING' },
  ],
  orderAlignmentDetails: [
    { orderId: 'PO-88712', assemblyId: 'MOTOR-CTRL-V2', status: 'PENDING' },
    { orderId: 'PO-88841', assemblyId: 'DRIVE-UNIT-X1', status: 'PENDING' },
  ],
};

const mockCycleTimeData: CycleTimeData = {
  changeId: 'ECR-2221',
  totalCycleDays: 18,
  longestStage: 'APPROVAL',
  approvalCycles: 1,
  createdAt: '2026-02-08T09:00:00Z',
  releasedAt: '2026-02-26T17:00:00Z',
  stageBreakdown: [
    { stage: 'DRAFT', durationDays: 2, startDate: '2026-02-08', endDate: '2026-02-10' },
    { stage: 'REVIEW', durationDays: 4, startDate: '2026-02-10', endDate: '2026-02-14' },
    { stage: 'APPROVAL', durationDays: 9, startDate: '2026-02-14', endDate: '2026-02-23' },
    { stage: 'RELEASE', durationDays: 3, startDate: '2026-02-23', endDate: '2026-02-26' },
  ],
};

const mockReconcileData: ReconcileData = {
  assemblyId: 'MOTOR-CTRL-V2',
  assemblyName: 'Motor Controller V2',
  totalLines: 5,
  alignedCount: 3,
  divergentCount: 2,
  lines: [
    { partNumber: 'C112', partName: 'Capacitor 10uF', ebomQty: 4, mbomQty: 4, ebomRevision: 'B', mbomRevision: 'B', category: 'ALIGNED' },
    { partNumber: 'R245', partName: 'Resistor 2.2K', ebomQty: 2, mbomQty: 2, ebomRevision: 'A', mbomRevision: 'A', category: 'ALIGNED' },
    { partNumber: 'IC-78L05', partName: 'Voltage Reg 5V', ebomQty: 1, mbomQty: 1, ebomRevision: 'C', mbomRevision: 'C', category: 'ALIGNED' },
    { partNumber: 'R250', partName: 'Resistor 4.7K', ebomQty: 2, mbomQty: 3, category: 'QTY_MISMATCH_EXPECTED', explanation: 'scrapFactor: 0.02 accounts for +1 quantity' },
    { partNumber: 'M-ALT-01', partName: 'Mounting Alt', ebomQty: undefined, mbomQty: 1, category: 'MBOM_ONLY_UNEXPECTED', explanation: 'No approved substitute relationship found' },
  ],
};

// ---- NLG text per workflow ----

const nlgTexts: Record<string, string> = {
  change_impact_analysis:
    'Replacing R245 with R250 affects 2 assemblies across the BOM tree. The most critical exposure is on Motor Controller V2, currently in production on PO-88712. Total financial exposure is $223,000 USD — $185k in WIP and $38k in on-hand inventory. Recommend reviewing PO-88712 before proceeding with the change release.',
  where_used_analysis:
    'R245 is used in 2 assemblies. It appears in Motor Controller V2 at depth 1, which in turn feeds into Drive Unit X1 — the top-level assembly. There is 1 top-level assembly in scope. The full upward path is: R245 → MOTOR-CTRL-V2 → DRIVE-UNIT-X1.',
  closure_status_query:
    'ECR-2221 was released in PLM 4 days ago. ERP propagation is partial — 1 of 3 MBOM updates have been applied. MES has not yet started. The current bottleneck is ERP. Escalate to the ERP team to complete MBOM-002 and MBOM-003 updates.',
  cycle_time_single:
    'ECR-2221 completed its lifecycle in 18 days total. The APPROVAL stage was the longest at 9 days, which included 1 rejection cycle. DRAFT (2d) and RELEASE (3d) were on target. Recommend reviewing the approval process to reduce the re-work cycle.',
  bom_comparison_ebom_mbom:
    'Motor Controller V2 has 2 divergences out of 5 BOM lines. R250 shows a quantity mismatch, but this is classified as EXPECTED due to an approved scrap factor of 2%. M-ALT-01 is present in the MBOM only with no approved substitute relationship — this is classified as UNEXPECTED and requires investigation.',
};

// ---- Mock intent per query ----

function detectMockIntent(query: string): ParsedIntent {
  const q = query.toLowerCase();
  if (q.includes('impact') || q.includes('replac'))
    return { intent: 'change_impact_analysis', confidence: 0.93, parameters: { sourcePart: 'R245', targetPart: 'R250', analysisType: 'full_impact' }, rawQuery: query };
  if (q.includes('where') && q.includes('used'))
    return { intent: 'where_used_analysis', confidence: 0.91, parameters: { partNumber: 'R245' }, rawQuery: query };
  if (q.includes('closure') || q.includes('ecr'))
    return { intent: 'closure_status_query', confidence: 0.89, parameters: { changeId: 'ECR-2221' }, rawQuery: query };
  if (q.includes('cycle') || q.includes('time'))
    return { intent: 'cycle_time_single', confidence: 0.87, parameters: { changeId: 'ECR-2221' }, rawQuery: query };
  if (q.includes('ebom') || q.includes('mbom') || q.includes('bom') || q.includes('reconcil'))
    return { intent: 'bom_comparison_ebom_mbom', confidence: 0.85, parameters: { assemblyId: 'MOTOR-CTRL-V2' }, rawQuery: query };
  return { intent: 'unknown', confidence: 0.3, parameters: { rawQuery: query }, rawQuery: query };
}

function buildMockWorkflowResult(intent: ParsedIntent): WorkflowResult {
  const base = { executionId: `mock-${Date.now()}`, durationMs: 1240 };
  const steps = [
    { name: 'Resolve identity', status: 'complete' as const, completedAt: Date.now() },
    { name: 'Fetch data', status: 'complete' as const, completedAt: Date.now() },
    { name: 'Compute result', status: 'complete' as const, completedAt: Date.now() },
  ];
  switch (intent.intent) {
    case 'change_impact_analysis':
      return { ...base, workflowType: 'change_impact_analysis', status: 'complete', steps, data: mockImpactData };
    case 'where_used_analysis':
      return { ...base, workflowType: 'where_used_analysis', status: 'complete', steps, data: mockWhereUsedData };
    case 'closure_status_query':
      return { ...base, workflowType: 'closure_status_query', status: 'complete', steps, data: mockClosureData };
    case 'cycle_time_single':
      return { ...base, workflowType: 'cycle_time_single', status: 'complete', steps, data: mockCycleTimeData };
    case 'bom_comparison_ebom_mbom':
      return { ...base, workflowType: 'bom_comparison_ebom_mbom', status: 'complete', steps, data: mockReconcileData };
    default:
      return { ...base, workflowType: 'unknown', status: 'declined', steps: [], data: null };
  }
}

export async function* mockSSE(query: string): AsyncGenerator<SSEEvent> {
  const sessionId = `session-mock-${Date.now()}`;
  const intent = detectMockIntent(query);
  const isKnown = intent.intent !== 'unknown';

  yield { type: 'session', sessionId } satisfies SSEEvent;
  await delay(120);

  yield { type: 'status', phase: 'parsing', label: 'Parsing intent…' } satisfies SSEEvent;
  await delay(600);

  yield { type: 'intent', intent } satisfies SSEEvent;
  await delay(200);

  if (!isKnown) {
    yield { type: 'status', phase: 'generating', label: 'Generating response…' } satisfies SSEEvent;
    const clarification = "I'm not sure what you're asking. Try asking about the impact of a part change, where a part is used, the closure status of an ECR, cycle time analysis, or EBOM/MBOM comparison.";
    for (const word of clarification.split(' ')) {
      yield { type: 'token', token: word + ' ' } satisfies SSEEvent;
      await delay(40);
    }
    yield { type: 'done' } satisfies SSEEvent;
    return;
  }

  const workflowNames: Record<string, string> = {
    change_impact_analysis: 'Change Impact Analysis',
    where_used_analysis: 'Where-Used Analysis',
    closure_status_query: 'Closure Status Query',
    cycle_time_single: 'Cycle Time Single',
    bom_comparison_ebom_mbom: 'EBOM/MBOM Reconciliation',
  };

  yield {
    type: 'status',
    phase: 'workflow',
    label: `Running ${workflowNames[intent.intent] ?? intent.intent}…`,
    workflowName: workflowNames[intent.intent],
  } satisfies SSEEvent;
  await delay(1200);

  const result = buildMockWorkflowResult(intent);
  yield { type: 'workflow', result } satisfies SSEEvent;
  await delay(200);

  yield { type: 'status', phase: 'generating', label: 'Generating response…' } satisfies SSEEvent;
  await delay(300);

  const nlg = nlgTexts[intent.intent] ?? 'Analysis complete.';
  for (const word of nlg.split(' ')) {
    yield { type: 'token', token: word + ' ' } satisfies SSEEvent;
    await delay(35);
  }

  yield { type: 'done' } satisfies SSEEvent;
}
