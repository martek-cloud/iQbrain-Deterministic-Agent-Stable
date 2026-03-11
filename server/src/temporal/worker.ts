import 'dotenv/config';
import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';
import { TEMPORAL_ADDRESS, TEMPORAL_NAMESPACE, TEMPORAL_TASK_QUEUE } from './client';

async function run() {
  const connection = await NativeConnection.connect({ address: TEMPORAL_ADDRESS });

  const worker = await Worker.create({
    connection,
    namespace: TEMPORAL_NAMESPACE,
    taskQueue: TEMPORAL_TASK_QUEUE,
    workflowsPath: require.resolve('./workflowBundle'),
    activities,
  });

  const activityNames = Object.keys(activities).join(', ');
  console.log(`[worker] IQBrain Temporal worker started · queue: ${TEMPORAL_TASK_QUEUE}`);
  console.log(`[worker] Registered activities: ${activityNames}`);

  await worker.run();
}

run().catch((err) => {
  console.error('[worker] Fatal:', err);
  process.exit(1);
});
