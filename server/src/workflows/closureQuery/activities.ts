import { CLOSURE_TRACKERS } from '../../adapters/data';
import type { ChangeClosureTracker } from '../../types/canonical';

export function getTrackerById(changeId: string): ChangeClosureTracker | null {
  return CLOSURE_TRACKERS[changeId.toUpperCase()] ?? null;
}

export function getAllOpenTrackers(): ChangeClosureTracker[] {
  return Object.values(CLOSURE_TRACKERS).filter((t) => t.overallStatus !== 'CLOSED');
}

export function filterByBottleneck(
  trackers: ChangeClosureTracker[],
  bottleneck: 'PLM' | 'ERP' | 'MES'
): ChangeClosureTracker[] {
  return trackers.filter((t) => t.bottleneck === bottleneck);
}
