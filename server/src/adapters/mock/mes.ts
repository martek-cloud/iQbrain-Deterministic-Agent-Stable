import type { IMESAdapter, HealthCheckResult } from '../interfaces';
import type { ProductionOrder } from '../../types/canonical';
import { PRODUCTION_ORDERS } from '../data';

export class MockMESAdapter implements IMESAdapter {
  async getProductionOrders(assemblyId?: string): Promise<ProductionOrder[]> {
    const all = Object.values(PRODUCTION_ORDERS);
    if (!assemblyId) return all;
    return all.filter((po) => po.assemblyId.toUpperCase() === assemblyId.toUpperCase());
  }

  async getProductionOrder(orderId: string): Promise<ProductionOrder | null> {
    return PRODUCTION_ORDERS[orderId.toUpperCase()] ?? null;
  }

  async healthCheck(): Promise<HealthCheckResult> {
    return { ok: true, latencyMs: 2, detail: 'mock-mes' };
  }
}
