import type { IPLMAdapter, HealthCheckResult } from '../interfaces';
import type { Part, Assembly, Change, Relationship, RelationshipType } from '../../types/canonical';
import { PARTS, ASSEMBLIES, CHANGES, RELATIONSHIPS } from './data';

export class MockPLMAdapter implements IPLMAdapter {
  async getPart(partNumber: string): Promise<Part | null> {
    return PARTS[partNumber.toUpperCase()] ?? null;
  }

  async getAssembly(assemblyId: string): Promise<Assembly | null> {
    return ASSEMBLIES[assemblyId.toUpperCase()] ?? null;
  }

  async getBOMChildren(assemblyId: string): Promise<Part[]> {
    const assembly = ASSEMBLIES[assemblyId.toUpperCase()];
    if (!assembly) return [];
    return assembly.ebom
      .map((b) => PARTS[b.partNumber.toUpperCase()])
      .filter((p): p is Part => p !== undefined);
  }

  async getChange(changeId: string): Promise<Change | null> {
    return CHANGES[changeId.toUpperCase()] ?? null;
  }

  async getChangesByStatus(status: Change['status']): Promise<Change[]> {
    return Object.values(CHANGES).filter((c) => c.status === status);
  }

  async getRelationships(canonicalId: string, type?: RelationshipType): Promise<Relationship[]> {
    return RELATIONSHIPS.filter(
      (r) => r.fromId === canonicalId && (type === undefined || r.type === type)
    );
  }

  async healthCheck(): Promise<HealthCheckResult> {
    return { ok: true, latencyMs: 2, detail: 'mock-plm' };
  }
}
