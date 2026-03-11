import { RELATIONSHIPS } from '../adapters/data';
import type { RelationshipType, Relationship } from '../types/canonical';

export function getRelationships(
  fromId: string,
  type?: RelationshipType
): Relationship[] {
  return RELATIONSHIPS.filter(
    (r) => r.fromId === fromId && (type === undefined || r.type === type)
  );
}

export function getRelationshipsTo(
  toId: string,
  type?: RelationshipType
): Relationship[] {
  return RELATIONSHIPS.filter(
    (r) => r.toId === toId && (type === undefined || r.type === type)
  );
}

export function hasRelationship(
  fromId: string,
  toId: string,
  type: RelationshipType
): boolean {
  return RELATIONSHIPS.some(
    (r) => r.fromId === fromId && r.toId === toId && r.type === type
  );
}
