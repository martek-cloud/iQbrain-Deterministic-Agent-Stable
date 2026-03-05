import type { IERPAdapter, HealthCheckResult } from '../interfaces';
import type { MBOMMapping, ProductionOrder, InventoryRecord, ChangeClosureTracker } from '../../types/canonical';
import { MBOM_MAPPINGS, PRODUCTION_ORDERS, INVENTORY, CLOSURE_TRACKERS } from './data';

export class MockERPAdapter implements IERPAdapter {
  async getMBOMMapping(mbomId: string): Promise<MBOMMapping | null> {
    return MBOM_MAPPINGS[mbomId.toUpperCase()] ?? null;
  }

  async getMBOMMappingsForAssembly(assemblyId: string): Promise<MBOMMapping[]> {
    return Object.values(MBOM_MAPPINGS).filter(
      (m) => m.assemblyId.toUpperCase() === assemblyId.toUpperCase()
    );
  }

  async getProductionOrder(orderId: string): Promise<ProductionOrder | null> {
    return PRODUCTION_ORDERS[orderId.toUpperCase()] ?? null;
  }

  async getProductionOrdersForAssembly(assemblyId: string): Promise<ProductionOrder[]> {
    return Object.values(PRODUCTION_ORDERS).filter(
      (po) => po.assemblyId.toUpperCase() === assemblyId.toUpperCase()
    );
  }

  async getInventory(partNumber: string): Promise<InventoryRecord | null> {
    return INVENTORY[partNumber.toUpperCase()] ?? null;
  }

  async getClosureTracker(changeId: string): Promise<ChangeClosureTracker | null> {
    return CLOSURE_TRACKERS[changeId.toUpperCase()] ?? null;
  }

  async getAllOpenClosureTrackers(): Promise<ChangeClosureTracker[]> {
    return Object.values(CLOSURE_TRACKERS).filter((t) => t.overallStatus !== 'CLOSED');
  }

  async healthCheck(): Promise<HealthCheckResult> {
    return { ok: true, latencyMs: 3, detail: 'mock-erp' };
  }
}
