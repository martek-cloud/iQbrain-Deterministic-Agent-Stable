import { Router, type Request, type Response } from 'express';
import { getConfig, setConfig } from '../config/store';
import type { AppConfig } from '../config/store';
import { requireAuth } from '../auth/middleware';

export const adminRouter = Router();

// All admin routes require auth
adminRouter.use(requireAuth);

function maskApiKey(key: string): string {
    if (!key || key.length < 12) return key;
    return key.slice(0, 8) + '****' + key.slice(-4);
}

// GET /api/admin/config — returns config with masked API key
adminRouter.get('/config', (_req: Request, res: Response): void => {
    const cfg = getConfig();
    const safe = {
        ...cfg,
        openrouterApiKey: maskApiKey(cfg.openrouterApiKey),
        _keyIsSet: cfg.openrouterApiKey.length > 0,
    };
    res.json(safe);
});

// PUT /api/admin/config — merges partial config update
adminRouter.put('/config', (req: Request, res: Response): void => {
    const body = req.body as Partial<AppConfig> & { openrouterApiKey?: string };

    // If the API key looks masked (contains ****), don't overwrite the real key
    if (body.openrouterApiKey !== undefined && body.openrouterApiKey.includes('****')) {
        delete body.openrouterApiKey;
    }

    // Validate accentColor is a valid hex
    if (body.accentColor && !/^#[0-9a-fA-F]{3,8}$/.test(body.accentColor)) {
        res.status(400).json({ error: 'accentColor must be a valid hex color (e.g. #f59e0b)' });
        return;
    }

    const saved = setConfig(body);
    res.json({
        ...saved,
        openrouterApiKey: maskApiKey(saved.openrouterApiKey),
        _keyIsSet: saved.openrouterApiKey.length > 0,
    });
});
