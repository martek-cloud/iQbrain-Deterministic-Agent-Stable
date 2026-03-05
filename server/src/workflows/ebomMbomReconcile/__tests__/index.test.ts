import { describe, it, expect } from 'vitest';
import { ebomMbomReconcilePlugin } from '../index';
import type { BomComparisonParams, ReconcileLine } from '../../../types/intents';

describe('ebomMbomReconcilePlugin', () => {
  it('MOTOR-CTRL-V2 returns lines', async () => {
    const params: BomComparisonParams = { assemblyId: 'MOTOR-CTRL-V2' };
    const result = await ebomMbomReconcilePlugin.workflowFn(params);
    expect(result.status).toBe('complete');
    if (result.workflowType === 'bom_comparison_ebom_mbom' && result.data) {
      expect(result.data.lines.length).toBeGreaterThan(0);
    }
  });

  it('R250 qty mismatch classified as EXPECTED due to scrapFactor', async () => {
    const params: BomComparisonParams = { assemblyId: 'MOTOR-CTRL-V2' };
    const result = await ebomMbomReconcilePlugin.workflowFn(params);
    if (result.workflowType === 'bom_comparison_ebom_mbom' && result.data) {
      const r250Lines: ReconcileLine[] = result.data.lines.filter((l) => l.partNumber === 'R250');
      const hasExpectedMismatch = r250Lines.some((l) => l.category === 'QTY_MISMATCH_EXPECTED');
      expect(hasExpectedMismatch).toBe(true);
    }
  });

  it('M-ALT-01 with no approved substitute is MBOM_ONLY_UNEXPECTED', async () => {
    const params: BomComparisonParams = { assemblyId: 'MOTOR-CTRL-V2' };
    const result = await ebomMbomReconcilePlugin.workflowFn(params);
    if (result.workflowType === 'bom_comparison_ebom_mbom' && result.data) {
      const malt: ReconcileLine | undefined = result.data.lines.find((l) => l.partNumber === 'M-ALT-01');
      expect(malt?.category).toBe('MBOM_ONLY_UNEXPECTED');
    }
  });

  it('returns error for unknown assembly', async () => {
    const params: BomComparisonParams = { assemblyId: 'NONEXISTENT-ASSY' };
    const result = await ebomMbomReconcilePlugin.workflowFn(params);
    expect(result.status).toBe('error');
  });
});
