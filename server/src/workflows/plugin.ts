import type { IntentType, IntentParams, WorkflowResult } from '../types/intents';

export interface WorkflowPlugin {
  /** Which intent this plugin handles */
  intentType: IntentType;
  /** Human-readable name for Temporal UI and logs */
  name: string;
  /** One-sentence description for clarification messages */
  description: string;
  /**
   * The Temporal workflow function.
   * MUST be a named function (not an arrow fn) for the Temporal bundler.
   * MUST NOT import from other workflow plugin folders.
   */
  workflowFn: (params: IntentParams) => Promise<WorkflowResult>;
}
