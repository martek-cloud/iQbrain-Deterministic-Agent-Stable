import type { WorkflowPlugin } from './plugin';
import { changeImpactPlugin } from './changeImpact';
import { whereUsedPlugin } from './whereUsed';
import { closureQueryPlugin } from './closureQuery';
import { cycleTimeSinglePlugin } from './cycleTimeSingle';
import { ebomMbomReconcilePlugin } from './ebomMbomReconcile';

export const WORKFLOW_REGISTRY: WorkflowPlugin[] = [
  changeImpactPlugin,
  whereUsedPlugin,
  closureQueryPlugin,
  cycleTimeSinglePlugin,
  ebomMbomReconcilePlugin,
  // ← adding a new plugin = ONE line here
];
