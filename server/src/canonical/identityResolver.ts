import type { AuthoritySystem } from '../types/canonical';
import { createHash } from 'crypto';

// In-memory identity map: system+externalId → canonicalId
// In production this would be a persistent store (Redis, Postgres, etc.)
const identityMap = new Map<string, string>();

function mapKey(system: AuthoritySystem, externalId: string): string {
  return `${system}::${externalId.toLowerCase()}`;
}

export function registerMapping(system: AuthoritySystem, externalId: string, canonicalId: string): void {
  identityMap.set(mapKey(system, externalId), canonicalId);
}

export function resolve(system: AuthoritySystem, externalId: string): string | null {
  return identityMap.get(mapKey(system, externalId)) ?? null;
}

/**
 * Mint a deterministic canonical ID from system + external ID.
 * Same input always produces the same canonical ID.
 */
export function mintCanonicalId(system: AuthoritySystem, externalId: string, entityType: string): string {
  const seed = `${system}::${entityType}::${externalId.toLowerCase()}`;
  const hash = createHash('sha256').update(seed).digest('hex').slice(0, 12);
  return `iqb:${entityType.toLowerCase()}:${hash}`;
}

/**
 * Resolve external ID to canonical ID, minting one if not found.
 * Side effect: registers the new mapping so subsequent calls return the same ID.
 */
export function resolveOrMint(
  system: AuthoritySystem,
  externalId: string,
  entityType: string
): string {
  const existing = resolve(system, externalId);
  if (existing) return existing;
  const newId = mintCanonicalId(system, externalId, entityType);
  registerMapping(system, externalId, newId);
  return newId;
}

// Pre-populate the identity map with known data
import { PARTS, ASSEMBLIES, CHANGES, MBOM_MAPPINGS, PRODUCTION_ORDERS } from '../adapters/mock/data';

(function preloadIdentityMap() {
  for (const part of Object.values(PARTS)) {
    for (const xid of part.externalIds) {
      registerMapping(xid.system, xid.id, part.canonicalId);
    }
    // Also register by partNumber for convenience
    registerMapping('PLM', part.partNumber, part.canonicalId);
  }
  for (const assembly of Object.values(ASSEMBLIES)) {
    for (const xid of assembly.externalIds) {
      registerMapping(xid.system, xid.id, assembly.canonicalId);
    }
    registerMapping('PLM', assembly.assemblyId, assembly.canonicalId);
  }
  for (const change of Object.values(CHANGES)) {
    for (const xid of change.externalIds) {
      registerMapping(xid.system, xid.id, change.canonicalId);
    }
    registerMapping('PLM', change.changeId, change.canonicalId);
  }
  for (const mbom of Object.values(MBOM_MAPPINGS)) {
    registerMapping('ERP', mbom.mbomId, mbom.canonicalId);
  }
  for (const po of Object.values(PRODUCTION_ORDERS)) {
    registerMapping('ERP', po.orderId, po.canonicalId);
  }
})();
