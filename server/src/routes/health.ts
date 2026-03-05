import { Router, type Request, type Response } from 'express';
import { toolRouter } from '../adapters/toolRouter';

export const healthRouter = Router();

const startTime = Date.now();

healthRouter.get('/', async (_req: Request, res: Response) => {
  const [plmHealth, erpHealth, mesHealth] = await Promise.allSettled([
    toolRouter.getPLM().healthCheck(),
    toolRouter.getERP().healthCheck(),
    toolRouter.getMES().healthCheck(),
  ]);

  const adapterStatus = (result: PromiseSettledResult<{ ok: boolean; latencyMs: number; detail?: string }>) =>
    result.status === 'fulfilled'
      ? { ok: result.value.ok, latencyMs: result.value.latencyMs, detail: result.value.detail }
      : { ok: false, error: (result.reason as Error).message };

  res.json({
    status: 'ok',
    phase: 'P6',
    version: '0.1.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    adapters: {
      plm: { type: process.env.PLM_ADAPTER ?? 'mock', ...adapterStatus(plmHealth) },
      erp: { type: process.env.ERP_ADAPTER ?? 'mock', ...adapterStatus(erpHealth) },
      mes: { type: process.env.MES_ADAPTER ?? 'mock', ...adapterStatus(mesHealth) },
    },
    openRouter: {
      configured: !!process.env.OPENROUTER_API_KEY,
      model: 'meta-llama/llama-3.3-70b-instruct:free',
    },
    temporal: {
      address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
      namespace: process.env.TEMPORAL_NAMESPACE ?? 'default',
      taskQueue: process.env.TEMPORAL_TASK_QUEUE ?? 'iqbrain-main',
    },
  });
});
