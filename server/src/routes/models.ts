import { Router, type Request, type Response } from 'express';
import { getOpenRouterKey, getConfig } from '../config/store';

export const modelsRouter = Router();

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface OpenRouterModelRaw {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: { prompt: string; completion: string };
  architecture?: { modality: string };
  top_provider?: { is_moderated: boolean };
}

let cache: { data: OpenRouterModelRaw[]; fetchedAt: number } | null = null;

modelsRouter.get('/', async (_req: Request, res: Response) => {
  const apiKey = getOpenRouterKey();

  if (!apiKey || apiKey === 'sk-or-...') {
    res.status(503).json({ error: 'OPENROUTER_API_KEY not configured' });
    return;
  }

  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    const filtered = applyAllowlist(cache.data);
    res.json({ models: filtered, cached: true, cachedAt: cache.fetchedAt });
    return;
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://iqbrain.ai',
        'X-Title': 'IQBrain',
      },
    });

    if (!response.ok) {
      res.status(502).json({ error: `OpenRouter returned ${response.status}` });
      return;
    }

    const json = (await response.json()) as { data: OpenRouterModelRaw[] };
    // Sort: free models first, then by name
    const sorted = [...json.data].sort((a, b) => {
      const aFree = a.id.endsWith(':free') ? 0 : 1;
      const bFree = b.id.endsWith(':free') ? 0 : 1;
      if (aFree !== bFree) return aFree - bFree;
      return a.name.localeCompare(b.name);
    });

    cache = { data: sorted, fetchedAt: Date.now() };
    res.json({ models: applyAllowlist(sorted), cached: false });
  } catch (err) {
    console.error('[models] Failed to fetch from OpenRouter:', err);
    res.status(502).json({ error: 'Failed to reach OpenRouter API' });
  }
});

function applyAllowlist(models: OpenRouterModelRaw[]): OpenRouterModelRaw[] {
  const { modelAllowlist } = getConfig();
  if (!modelAllowlist || modelAllowlist.length === 0) return models;
  return models.filter((m) => modelAllowlist.includes(m.id));
}
