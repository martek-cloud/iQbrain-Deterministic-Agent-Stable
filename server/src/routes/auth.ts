import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { findUser, verifyPassword } from '../auth/users';
import { requireAuth } from '../auth/middleware';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', (req: Request, res: Response): void => {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
        res.status(400).json({ error: 'username and password are required' });
        return;
    }

    const user = findUser(username);
    if (!user || !verifyPassword(password, user.passwordHash)) {
        // Identical error for user-not-found and wrong-password (prevents username enumeration)
        res.status(401).json({ error: 'Invalid username or password' });
        return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        res.status(500).json({ error: 'Auth misconfiguration: JWT_SECRET not set' });
        return;
    }

    const expiresIn = process.env.JWT_EXPIRES_IN ?? '8h';
    const token = jwt.sign(
        { username: user.username, displayName: user.displayName },
        secret,
        { expiresIn } as jwt.SignOptions
    );

    res.json({ token, user: { username: user.username, displayName: user.displayName } });
});

// GET /api/auth/me — verify current token and return user info
authRouter.get('/me', requireAuth, (req: Request, res: Response): void => {
    res.json({ user: req.user });
});

// POST /api/auth/logout — stateless: client drops the token
authRouter.post('/logout', (_req: Request, res: Response): void => {
    res.json({ ok: true });
});
