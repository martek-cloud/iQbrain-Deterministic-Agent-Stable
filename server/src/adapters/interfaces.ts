import type {
  Part,
  Assembly,
  Change,
  MBOMMapping,
  ProductionOrder,
  InventoryRecord,
  ChangeClosureTracker,
  Relationship,
  RelationshipType,
} from '../types/canonical';

export interface ToolCallError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface HealthCheckResult {
  ok: boolean;
  latencyMs: number;
  detail?: string;
}

// ============================================================
// IPLMAdapter — Product Lifecycle Management
// ============================================================
export interface IPLMAdapter {
  getPart(partNumber: string): Promise<Part | null>;
  getAssembly(assemblyId: string): Promise<Assembly | null>;
  getBOMChildren(assemblyId: string): Promise<Part[]>;
  getChange(changeId: string): Promise<Change | null>;
  getChangesByStatus(status: Change['status']): Promise<Change[]>;
  getRelationships(canonicalId: string, type?: RelationshipType): Promise<Relationship[]>;
  healthCheck(): Promise<HealthCheckResult>;
}

// ============================================================
// IERPAdapter — Enterprise Resource Planning
// ============================================================
export interface IERPAdapter {
  getMBOMMapping(mbomId: string): Promise<MBOMMapping | null>;
  getMBOMMappingsForAssembly(assemblyId: string): Promise<MBOMMapping[]>;
  getProductionOrder(orderId: string): Promise<ProductionOrder | null>;
  getProductionOrdersForAssembly(assemblyId: string): Promise<ProductionOrder[]>;
  getInventory(partNumber: string): Promise<InventoryRecord | null>;
  getClosureTracker(changeId: string): Promise<ChangeClosureTracker | null>;
  getAllOpenClosureTrackers(): Promise<ChangeClosureTracker[]>;
  healthCheck(): Promise<HealthCheckResult>;
}

// ============================================================
// IMESAdapter — Manufacturing Execution System
// ============================================================
export interface IMESAdapter {
  getProductionOrders(assemblyId?: string): Promise<ProductionOrder[]>;
  getProductionOrder(orderId: string): Promise<ProductionOrder | null>;
  healthCheck(): Promise<HealthCheckResult>;
}
