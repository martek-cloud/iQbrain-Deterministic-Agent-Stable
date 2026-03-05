import 'dotenv/config';
import { Worker, NativeConnection } from '@temporalio/worker';
import { WORKFLOW_REGISTRY } from '../workflows/registry';
import { TEMPORAL_ADDRESS, TEMPORAL_NAMESPACE, TEMPORAL_TASK_QUEUE } from './client';

async function run() {
  const connection = await NativeConnection.connect({ address: TEMPORAL_ADDRESS });

  // Build workflow map from registry — names must match WORKFLOW_REGISTRY in intentRouter.ts
  const workflowNameToFn = Object.fromEntries(
    WORKFLOW_REGISTRY.map((plugin) => [plugin.name.replace(/\s+/g, ''), plugin.workflowFn])
  );

  // Collect all activity functions from each plugin's activities module
  // Activities are plain async functions — not imported here directly (Temporal bundles separately)
  // For now, use require() to auto-collect at runtime
  const allActivities: Record<string, (...args: unknown[]) => Promise<unknown>> = {};

  const worker = await Worker.create({
    connection,
    namespace: TEMPORAL_NAMESPACE,
    taskQueue: TEMPORAL_TASK_QUEUE,
    workflowsPath: require.resolve('./workflowBundle'),
    activities: allActivities,
  });

  const pluginNames = WORKFLOW_REGISTRY.map((p) => p.name).join(', ');
  console.log(`[worker] IQBrain Temporal worker started · queue: ${TEMPORAL_TASK_QUEUE}`);
  console.log(`[worker] Registered plugins: ${pluginNames}`);
  void workflowNameToFn;

  await worker.run();
}

run().catch((err) => {
  console.error('[worker] Fatal:', err);
  process.exit(1);
});
