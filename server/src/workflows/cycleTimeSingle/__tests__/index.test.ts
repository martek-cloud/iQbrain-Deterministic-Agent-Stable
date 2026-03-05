import { describe, it, expect } from 'vitest';
import { cycleTimeSinglePlugin } from '../index';
import type { CycleTimeSingleParams } from '../../../types/intents';

describe('cycleTimeSinglePlugin', () => {
  it('ECR-2221 longestStage is APPROVAL', async () => {
    const params: CycleTimeSingleParams = { changeId: 'ECR-2221' };
    const result = await cycleTimeSinglePlugin.workflowFn(params);
    expect(result.status).toBe('complete');
    if (result.workflowType === 'cycle_time_single' && result.data) {
      expect(result.data.longestStage).toBe('APPROVAL');
    }
  });

  it('ECR-2221 approvalCycles is 1 (one rejection)', async () => {
    const params: CycleTimeSingleParams = { changeId: 'ECR-2221' };
    const result = await cycleTimeSinglePlugin.workflowFn(params);
    if (result.workflowType === 'cycle_time_single' && result.data) {
      expect(result.data.approvalCycles).toBe(1);
    }
  });

  it('totalCycleDays equals sum of stage durations within tolerance', async () => {
    const params: CycleTimeSingleParams = { changeId: 'ECR-2221' };
    const result = await cycleTimeSinglePlugin.workflowFn(params);
    if (result.workflowType === 'cycle_time_single' && result.data) {
      const sumStages = result.data.stageBreakdown.reduce((s, st) => s + st.durationDays, 0);
      expect(Math.abs(result.data.totalCycleDays - sumStages)).toBeLessThan(0.15);
    }
  });

  it('returns error for unknown change', async () => {
    const params: CycleTimeSingleParams = { changeId: 'NONEXISTENT-999' };
    const result = await cycleTimeSinglePlugin.workflowFn(params);
    expect(result.status).toBe('error');
  });
});
