import { describe, it, expect } from 'vitest';
import { changeImpactPlugin } from '../index';
import type { ChangeImpactParams } from '../../../types/intents';

describe('changeImpactPlugin', () => {
  it('returns complete result for known part R245', async () => {
    const params: ChangeImpactParams = { sourcePart: 'R245', targetPart: 'R250', analysisType: 'full_impact' };
    const result = await changeImpactPlugin.workflowFn(params);
    expect(result.status).toBe('complete');
    expect(result.workflowType).toBe('change_impact_analysis');
    if (result.workflowType === 'change_impact_analysis' && result.data) {
      expect(result.data.affectedAssemblies.length).toBeGreaterThan(0);
    }
    expect(result.steps.length).toBe(5);
    expect(result.steps.every((s) => s.status === 'complete')).toBe(true);
  });

  it('returns error for unknown part', async () => {
    const params: ChangeImpactParams = { sourcePart: 'NONEXISTENT-999' };
    const result = await changeImpactPlugin.workflowFn(params);
    expect(result.status).toBe('error');
    expect(result.errorMessage).toContain('NONEXISTENT-999');
  });

  it('financial exposure totalExposure = wipExposure + inventoryExposure', async () => {
    const params: ChangeImpactParams = { sourcePart: 'R245' };
    const result = await changeImpactPlugin.workflowFn(params);
    if (result.workflowType === 'change_impact_analysis' && result.status === 'complete' && result.data) {
      const { wipExposure, inventoryExposure, totalExposure } = result.data.financialSummary;
      expect(Math.abs(totalExposure - (wipExposure + inventoryExposure))).toBeLessThan(0.1);
    }
  });

  it('result contains all 5 step names', async () => {
    const params: ChangeImpactParams = { sourcePart: 'R245' };
    const result = await changeImpactPlugin.workflowFn(params);
    const stepNames = result.steps.map((s) => s.name);
    expect(stepNames).toContain('Resolve part identity');
    expect(stepNames).toContain('Traverse where-used');
    expect(stepNames).toContain('Fetch production orders');
    expect(stepNames).toContain('Fetch inventory');
    expect(stepNames).toContain('Calculate financial exposure');
  });
});
