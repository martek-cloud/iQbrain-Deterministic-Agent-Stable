import { Client, Connection } from '@temporalio/client';

export const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS ?? 'localhost:7233';
export const TEMPORAL_NAMESPACE = process.env.TEMPORAL_NAMESPACE ?? 'default';
export const TEMPORAL_TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE ?? 'iqbrain-main';

let _client: Client | null = null;

export async function getTemporalClient(): Promise<Client> {
  if (_client) return _client;

  if (!process.env.TEMPORAL_ADDRESS) {
    console.warn('[temporal] TEMPORAL_ADDRESS not set, falling back to localhost:7233');
  }

  const connection = await Connection.connect({ address: TEMPORAL_ADDRESS });
  _client = new Client({ connection, namespace: TEMPORAL_NAMESPACE });
  return _client;
}
