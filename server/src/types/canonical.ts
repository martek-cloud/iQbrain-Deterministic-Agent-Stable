// Forward declaration — filled in fully at P5-T1
// Canonical entity types for PLM/ERP/MES data model

export type AuthoritySystem = 'PLM' | 'ERP' | 'MES';

export type RelationshipType =
  | 'USED_IN'
  | 'USES'
  | 'REPLACES'
  | 'REPLACED_BY'
  | 'TRACKED_BY'
  | 'TRACKS'
  | 'AFFECTS'
  | 'AFFECTED_BY'
  | 'APPROVED_SUBSTITUTE'
  | 'EQUIVALENT_TO'
  | 'PARENT_ASSEMBLY'
  | 'CHILD_COMPONENT'
  | 'RELEASED_VIA';

export interface ExternalId {
  system: AuthoritySystem;
  id: string;
}

export interface Part {
  canonicalId: string;
  partNumber: string;
  name: string;
  revision: string;
  status: 'IN_DESIGN' | 'IN_REVIEW' | 'RELEASED' | 'OBSOLETE';
  externalIds: ExternalId[];
  unitCost?: number;
  currency?: string;
}

export interface BOMNode {
  partId: string;
  partNumber: string;
  quantity: number;
  unit: string;
  findNumber?: string;
  scrapFactor?: number;
  bomRevision?: string;
}

export interface Assembly {
  canonicalId: string;
  assemblyId: string;
  name: string;
  revision: string;
  isTopLevel: boolean;
  ebom: BOMNode[];
  externalIds: ExternalId[];
}

export type StageTransition = {
  stage: string;
  enteredAt: string;
  exitedAt?: string;
  actor?: string;
  action?: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'RELEASE';
};

export interface Change {
  canonicalId: string;
  changeId: string;
  title: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'RELEASED' | 'OBSOLETE';
  createdAt: string;
  releasedAt?: string;
  affectedParts: string[];
  lifecycleHistory: StageTransition[];
  externalIds: ExternalId[];
}

export interface MBOMMapping {
  canonicalId: string;
  mbomId: string;
  assemblyId: string;
  bomRevision: string;
  lines: BOMNode[];
  lastSyncedAt: string;
  changeId?: string;
}

export interface ProductionOrder {
  canonicalId: string;
  orderId: string;
  assemblyId: string;
  mbomRevision: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETE' | 'ON_HOLD';
  quantity: number;
  estimatedValue: number;
  currency: string;
  scheduledStart?: string;
  scheduledEnd?: string;
}

export interface InventoryRecord {
  partId: string;
  partNumber: string;
  onHandQty: number;
  unitCost: number;
  currency: string;
  warehouseId: string;
}

export type MBOMUpdateStatus = 'UPDATED' | 'PENDING' | 'NOT_APPLICABLE';
export type OrderAlignmentStatus = 'ALIGNED' | 'PENDING' | 'FLAGGED';

export interface MBOMUpdateDetail {
  mbomId: string;
  assemblyId: string;
  status: MBOMUpdateStatus;
  updatedAt?: string;
}

export interface OrderAlignmentDetail {
  orderId: string;
  assemblyId: string;
  status: OrderAlignmentStatus;
}

export interface ChangeClosureTracker {
  canonicalId: string;
  changeId: string;
  overallStatus: 'PLM_RELEASED' | 'ERP_PARTIAL' | 'ERP_COMPLETE' | 'MES_PARTIAL' | 'CLOSED';
  erpStatus: 'NOT_STARTED' | 'PARTIAL' | 'COMPLETE';
  mesStatus: 'NOT_STARTED' | 'PARTIAL' | 'COMPLETE';
  mbomUpdatesRequired: number;
  mbomUpdatesComplete: number;
  ordersAffected: number;
  ordersAligned: number;
  bottleneck?: AuthoritySystem;
  lagDays: number;
  mbomUpdateDetails: MBOMUpdateDetail[];
  orderAlignmentDetails: OrderAlignmentDetail[];
  startedAt: string;
  lastCheckedAt: string;
}

export interface Relationship {
  fromId: string;
  toId: string;
  type: RelationshipType;
  authority: AuthoritySystem;
  metadata?: Record<string, unknown>;
}
