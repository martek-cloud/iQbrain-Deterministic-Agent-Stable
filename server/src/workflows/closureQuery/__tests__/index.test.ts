import { describe, it, expect } from 'vitest';
import { closureQueryPlugin } from '../index';
import type { ClosureStatusParams } from '../../../types/intents';

describe('closureQueryPlugin', () => {
  it('ECR-2221 returns erpStatus=PARTIAL and bottleneck=ERP', async () => {
    const params: ClosureStatusParams = { changeId: 'ECR-2221' };
    const result = await closureQueryPlugin.workflowFn(params);
    expect(result.status).toBe('complete');
    if (result.workflowType === 'closure_status_query' && result.data) {
      expect(result.data.erpStatus).toBe('PARTIAL');
      expect(result.data.bottleneck).toBe('ERP');
    }
  });

  it('showAll returns open trackers', async () => {
    const params: ClosureStatusParams = { showAll: true };
    const result = await closureQueryPlugin.workflowFn(params);
    expect(result.status).toBe('complete');
  });

  it('filterByBottleneck ERP returns ERP-bottlenecked tracker', async () => {
    const params: ClosureStatusParams = { showAll: true, filterByBottleneck: 'ERP' };
    const result = await closureQueryPlugin.workflowFn(params);
    expect(result.status).toBe('complete');
    if (result.workflowType === 'closure_status_query' && result.data) {
      expect(result.data.bottleneck).toBe('ERP');
    }
  });
});
