import { CHANGES } from '../../adapters/data';
import type { Change, StageTransition } from '../../types/canonical';
import type { StageMetric, CycleTimeData } from '../../types/intents';

export function getChange(changeId: string): Change | null {
  return CHANGES[changeId.toUpperCase()] ?? null;
}

export function computeMetrics(change: Change): CycleTimeData {
  const history = change.lifecycleHistory;

  // Build stage durations from transitions
  const stageMap = new Map<string, { totalMs: number; entries: number }>();

  const processEntry = (entry: StageTransition) => {
    const start = new Date(entry.enteredAt).getTime();
    const end = entry.exitedAt ? new Date(entry.exitedAt).getTime() : Date.now();
    const ms = end - start;
    const existing = stageMap.get(entry.stage) ?? { totalMs: 0, entries: 0 };
    stageMap.set(entry.stage, { totalMs: existing.totalMs + ms, entries: existing.entries + 1 });
  };

  history.forEach(processEntry);

  const stageBreakdown: StageMetric[] = [];
  // Preserve order — iterate history stages in order of first appearance
  const seenStages = new Set<string>();
  for (const entry of history) {
    if (seenStages.has(entry.stage)) continue;
    seenStages.add(entry.stage);
    const { totalMs } = stageMap.get(entry.stage) ?? { totalMs: 0 };
    const durationDays = Math.round((totalMs / (1000 * 60 * 60 * 24)) * 10) / 10;
    stageBreakdown.push({
      stage: entry.stage,
      durationDays,
      startDate: entry.enteredAt.slice(0, 10),
      endDate: (entry.exitedAt ?? new Date().toISOString()).slice(0, 10),
    });
  }

  const totalCycleDays = Math.round(stageBreakdown.reduce((s, st) => s + st.durationDays, 0) * 10) / 10;
  const longestStage = stageBreakdown.reduce((a, b) => (b.durationDays > a.durationDays ? b : a)).stage;

  // Approval cycles = number of REJECT transitions
  const approvalCycles = history.filter((t) => t.action === 'REJECT').length;

  return {
    changeId: change.changeId,
    totalCycleDays,
    longestStage,
    approvalCycles,
    stageBreakdown,
    createdAt: change.createdAt,
    releasedAt: change.releasedAt ?? '',
  };
}
