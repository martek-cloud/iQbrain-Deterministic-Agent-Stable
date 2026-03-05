import { describe, it, expect } from 'vitest';
import { whereUsedPlugin } from '../index';
import type { WhereUsedParams } from '../../../types/intents';

describe('whereUsedPlugin', () => {
  it('R245 reaches MOTOR-CTRL-V2', async () => {
    const params: WhereUsedParams = { partNumber: 'R245' };
    const result = await whereUsedPlugin.workflowFn(params);
    expect(result.status).toBe('complete');
    if (result.workflowType === 'where_used_analysis' && result.data) {
      const assemblyIds = result.data.tree.map((n) => n.assemblyId);
      expect(assemblyIds).toContain('MOTOR-CTRL-V2');
    }
  });

  it('depth tracked correctly', async () => {
    const params: WhereUsedParams = { partNumber: 'R245' };
    const result = await whereUsedPlugin.workflowFn(params);
    if (result.workflowType === 'where_used_analysis' && result.data) {
      expect(result.data.maxDepthReached).toBeGreaterThanOrEqual(1);
    }
  });

  it('TOP-level assemblies identified', async () => {
    const params: WhereUsedParams = { partNumber: 'R245' };
    const result = await whereUsedPlugin.workflowFn(params);
    if (result.workflowType === 'where_used_analysis' && result.data) {
      expect(result.data.topLevelCount).toBeGreaterThanOrEqual(1);
    }
  });

  it('returns error for unknown part', async () => {
    const params: WhereUsedParams = { partNumber: 'ZZZUNKNOWN' };
    const result = await whereUsedPlugin.workflowFn(params);
    expect(result.status).toBe('error');
  });
});
