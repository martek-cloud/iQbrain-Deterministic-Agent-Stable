import { v4 as uuidv4 } from 'uuid';
import type { WorkflowStep, WorkflowResult } from '../types/intents';

export { uuidv4 };

export function makeStep(name: string): WorkflowStep {
  return { name, status: 'running', startedAt: Date.now() };
}

export function completeStep(step: WorkflowStep): WorkflowStep {
  return { ...step, status: 'complete', completedAt: Date.now() };
}

export function errorStep(step: WorkflowStep, message: string): WorkflowStep {
  return { ...step, status: 'error', completedAt: Date.now(), errorMessage: message };
}

export function errorResult(
  workflowType: WorkflowResult['workflowType'],
  executionId: string,
  startMs: number,
  steps: WorkflowStep[],
  message: string
): WorkflowResult {
  return {
    workflowType,
    status: 'error',
    steps,
    data: null as unknown as never,
    executionId,
    durationMs: Date.now() - startMs,
    errorMessage: message,
  };
}
