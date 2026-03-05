import type {
  Part,
  Assembly,
  Change,
  MBOMMapping,
  ProductionOrder,
  InventoryRecord,
  ChangeClosureTracker,
  Relationship,
} from '../../types/canonical';

// ============================================================
// Parts
// ============================================================
export const PARTS: Record<string, Part> = {
  'R245': {
    canonicalId: 'iqb:part:r245',
    partNumber: 'R245',
    name: 'Resistor 2.2K Ohm',
    revision: 'A',
    status: 'RELEASED',
    externalIds: [{ system: 'PLM', id: 'PLM-PART-R245' }],
    unitCost: 0.12,
    currency: 'USD',
  },
  'R250': {
    canonicalId: 'iqb:part:r250',
    partNumber: 'R250',
    name: 'Resistor 4.7K Ohm',
    revision: 'B',
    status: 'RELEASED',
    externalIds: [{ system: 'PLM', id: 'PLM-PART-R250' }],
    unitCost: 0.14,
    currency: 'USD',
  },
  'C112': {
    canonicalId: 'iqb:part:c112',
    partNumber: 'C112',
    name: 'Capacitor 10uF',
    revision: 'B',
    status: 'RELEASED',
    externalIds: [{ system: 'PLM', id: 'PLM-PART-C112' }],
    unitCost: 0.22,
    currency: 'USD',
  },
  'IC-78L05': {
    canonicalId: 'iqb:part:ic-78l05',
    partNumber: 'IC-78L05',
    name: 'Voltage Regulator 5V',
    revision: 'C',
    status: 'RELEASED',
    externalIds: [{ system: 'PLM', id: 'PLM-PART-IC78L05' }],
    unitCost: 1.85,
    currency: 'USD',
  },
  'M-ALT-01': {
    canonicalId: 'iqb:part:m-alt-01',
    partNumber: 'M-ALT-01',
    name: 'Mounting Alternative 01',
    revision: 'A',
    status: 'RELEASED',
    externalIds: [{ system: 'ERP', id: 'ERP-MAT-MALT01' }],
    unitCost: 0.05,
    currency: 'USD',
  },
};

// ============================================================
// Assemblies
// ============================================================
export const ASSEMBLIES: Record<string, Assembly> = {
  'MOTOR-CTRL-V2': {
    canonicalId: 'iqb:assembly:motor-ctrl-v2',
    assemblyId: 'MOTOR-CTRL-V2',
    name: 'Motor Controller V2',
    revision: 'C',
    isTopLevel: false,
    externalIds: [{ system: 'PLM', id: 'PLM-ASSY-MCTRLV2' }],
    ebom: [
      { partId: 'iqb:part:r245', partNumber: 'R245', quantity: 2, unit: 'EA' },
      { partId: 'iqb:part:c112', partNumber: 'C112', quantity: 4, unit: 'EA' },
      { partId: 'iqb:part:ic-78l05', partNumber: 'IC-78L05', quantity: 1, unit: 'EA' },
      { partId: 'iqb:part:r250', partNumber: 'R250', quantity: 2, unit: 'EA' },
    ],
  },
  'DRIVE-UNIT-X1': {
    canonicalId: 'iqb:assembly:drive-unit-x1',
    assemblyId: 'DRIVE-UNIT-X1',
    name: 'Drive Unit X1',
    revision: 'B',
    isTopLevel: true,
    externalIds: [{ system: 'PLM', id: 'PLM-ASSY-DRVUX1' }],
    ebom: [
      { partId: 'iqb:assembly:motor-ctrl-v2', partNumber: 'MOTOR-CTRL-V2', quantity: 1, unit: 'EA' },
    ],
  },
};

// ============================================================
// Changes
// ============================================================
export const CHANGES: Record<string, Change> = {
  'ECR-2221': {
    canonicalId: 'iqb:change:ecr-2221',
    changeId: 'ECR-2221',
    title: 'Replace R245 with R250 in Motor Controller V2',
    status: 'RELEASED',
    createdAt: '2026-02-08T09:00:00Z',
    releasedAt: '2026-02-26T17:00:00Z',
    affectedParts: ['iqb:part:r245', 'iqb:part:r250', 'iqb:assembly:motor-ctrl-v2'],
    externalIds: [{ system: 'PLM', id: 'PLM-ECR-2221' }],
    lifecycleHistory: [
      { stage: 'DRAFT', enteredAt: '2026-02-08T09:00:00Z', exitedAt: '2026-02-10T17:00:00Z', action: 'SUBMIT' },
      { stage: 'REVIEW', enteredAt: '2026-02-10T17:00:00Z', exitedAt: '2026-02-13T09:00:00Z', action: 'SUBMIT' },
      { stage: 'APPROVAL', enteredAt: '2026-02-13T09:00:00Z', exitedAt: '2026-02-17T09:00:00Z', action: 'REJECT', actor: 'J.Smith' },
      { stage: 'REVIEW', enteredAt: '2026-02-17T09:00:00Z', exitedAt: '2026-02-18T17:00:00Z', action: 'SUBMIT' },
      { stage: 'APPROVAL', enteredAt: '2026-02-18T17:00:00Z', exitedAt: '2026-02-24T09:00:00Z', action: 'APPROVE', actor: 'J.Smith' },
      { stage: 'RELEASE', enteredAt: '2026-02-24T09:00:00Z', exitedAt: '2026-02-26T17:00:00Z', action: 'RELEASE' },
    ],
  },
  'ECO-1145': {
    canonicalId: 'iqb:change:eco-1145',
    changeId: 'ECO-1145',
    title: 'Update capacitor spec on MOTOR-CTRL-V2',
    status: 'IN_REVIEW',
    createdAt: '2026-03-01T08:00:00Z',
    affectedParts: ['iqb:part:c112', 'iqb:assembly:motor-ctrl-v2'],
    externalIds: [{ system: 'PLM', id: 'PLM-ECO-1145' }],
    lifecycleHistory: [
      { stage: 'DRAFT', enteredAt: '2026-03-01T08:00:00Z', exitedAt: '2026-03-02T10:00:00Z', action: 'SUBMIT' },
      { stage: 'REVIEW', enteredAt: '2026-03-02T10:00:00Z' },
    ],
  },
};

// ============================================================
// MBOM Mappings
// ============================================================
export const MBOM_MAPPINGS: Record<string, MBOMMapping> = {
  'MBOM-001': {
    canonicalId: 'iqb:mbom:mbom-001',
    mbomId: 'MBOM-001',
    assemblyId: 'MOTOR-CTRL-V2',
    bomRevision: 'C',
    changeId: 'ECR-2221',
    lastSyncedAt: '2026-02-28T10:00:00Z',
    lines: [
      { partId: 'iqb:part:r250', partNumber: 'R250', quantity: 3, unit: 'EA', scrapFactor: 0.02 },
      { partId: 'iqb:part:c112', partNumber: 'C112', quantity: 4, unit: 'EA' },
      { partId: 'iqb:part:ic-78l05', partNumber: 'IC-78L05', quantity: 1, unit: 'EA' },
      { partId: 'iqb:part:m-alt-01', partNumber: 'M-ALT-01', quantity: 1, unit: 'EA' },
    ],
  },
  'MBOM-002': {
    canonicalId: 'iqb:mbom:mbom-002',
    mbomId: 'MBOM-002',
    assemblyId: 'DRIVE-UNIT-X1',
    bomRevision: 'B',
    lastSyncedAt: '2026-02-20T08:00:00Z',
    lines: [
      { partId: 'iqb:assembly:motor-ctrl-v2', partNumber: 'MOTOR-CTRL-V2', quantity: 1, unit: 'EA' },
    ],
  },
  'MBOM-003': {
    canonicalId: 'iqb:mbom:mbom-003',
    mbomId: 'MBOM-003',
    assemblyId: 'DRIVE-UNIT-X1-SUB',
    bomRevision: 'A',
    lastSyncedAt: '2026-02-15T08:00:00Z',
    lines: [],
  },
};

// ============================================================
// Production Orders
// ============================================================
export const PRODUCTION_ORDERS: Record<string, ProductionOrder> = {
  'PO-88712': {
    canonicalId: 'iqb:po:po-88712',
    orderId: 'PO-88712',
    assemblyId: 'MOTOR-CTRL-V2',
    mbomRevision: 'B',
    status: 'IN_PROGRESS',
    quantity: 24,
    estimatedValue: 185000,
    currency: 'USD',
    scheduledStart: '2026-02-15T00:00:00Z',
    scheduledEnd: '2026-03-15T00:00:00Z',
  },
  'PO-88841': {
    canonicalId: 'iqb:po:po-88841',
    orderId: 'PO-88841',
    assemblyId: 'DRIVE-UNIT-X1',
    mbomRevision: 'B',
    status: 'PLANNED',
    quantity: 12,
    estimatedValue: 111000,
    currency: 'USD',
    scheduledStart: '2026-03-20T00:00:00Z',
    scheduledEnd: '2026-04-20T00:00:00Z',
  },
};

// ============================================================
// Inventory Records
// ============================================================
export const INVENTORY: Record<string, InventoryRecord> = {
  'R245': {
    partId: 'iqb:part:r245',
    partNumber: 'R245',
    onHandQty: 312,
    unitCost: 0.12,
    currency: 'USD',
    warehouseId: 'WH-01',
  },
  'R250': {
    partId: 'iqb:part:r250',
    partNumber: 'R250',
    onHandQty: 0,
    unitCost: 0.14,
    currency: 'USD',
    warehouseId: 'WH-01',
  },
};

// ============================================================
// Closure Trackers
// ============================================================
export const CLOSURE_TRACKERS: Record<string, ChangeClosureTracker> = {
  'ECR-2221': {
    canonicalId: 'iqb:tracker:ecr-2221',
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
    startedAt: '2026-02-26T17:00:00Z',
    lastCheckedAt: '2026-03-01T08:00:00Z',
  },
};

// ============================================================
// Relationships
// ============================================================
export const RELATIONSHIPS: Relationship[] = [
  // R245 USED_IN MOTOR-CTRL-V2
  { fromId: 'iqb:part:r245', toId: 'iqb:assembly:motor-ctrl-v2', type: 'USED_IN', authority: 'PLM' },
  // MOTOR-CTRL-V2 USES R245
  { fromId: 'iqb:assembly:motor-ctrl-v2', toId: 'iqb:part:r245', type: 'USES', authority: 'PLM' },
  // MOTOR-CTRL-V2 USED_IN DRIVE-UNIT-X1
  { fromId: 'iqb:assembly:motor-ctrl-v2', toId: 'iqb:assembly:drive-unit-x1', type: 'USED_IN', authority: 'PLM' },
  // DRIVE-UNIT-X1 USES MOTOR-CTRL-V2
  { fromId: 'iqb:assembly:drive-unit-x1', toId: 'iqb:assembly:motor-ctrl-v2', type: 'USES', authority: 'PLM' },
  // R245 REPLACES → R250 (ECR-2221 context)
  { fromId: 'iqb:part:r245', toId: 'iqb:part:r250', type: 'REPLACES', authority: 'PLM', metadata: { changeId: 'ECR-2221' } },
  { fromId: 'iqb:part:r250', toId: 'iqb:part:r245', type: 'REPLACED_BY', authority: 'PLM', metadata: { changeId: 'ECR-2221' } },
  // ECR-2221 TRACKED_BY closure tracker
  { fromId: 'iqb:change:ecr-2221', toId: 'iqb:tracker:ecr-2221', type: 'TRACKED_BY', authority: 'PLM' },
  // ECR-2221 AFFECTS assemblies
  { fromId: 'iqb:change:ecr-2221', toId: 'iqb:assembly:motor-ctrl-v2', type: 'AFFECTS', authority: 'PLM' },
  { fromId: 'iqb:change:ecr-2221', toId: 'iqb:assembly:drive-unit-x1', type: 'AFFECTS', authority: 'PLM' },
  // PARENT/CHILD
  { fromId: 'iqb:assembly:drive-unit-x1', toId: 'iqb:assembly:motor-ctrl-v2', type: 'PARENT_ASSEMBLY', authority: 'PLM' },
  { fromId: 'iqb:assembly:motor-ctrl-v2', toId: 'iqb:assembly:drive-unit-x1', type: 'CHILD_COMPONENT', authority: 'PLM' },
  // M-ALT-01 has no approved substitute (intentional — for EBOM-MBOM test)
  { fromId: 'iqb:assembly:motor-ctrl-v2', toId: 'iqb:part:r250', type: 'USES', authority: 'ERP' },
  // ECR-2221 released via PLM
  { fromId: 'iqb:change:ecr-2221', toId: 'iqb:part:r245', type: 'RELEASED_VIA', authority: 'PLM' },
];
