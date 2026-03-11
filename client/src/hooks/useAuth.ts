import { useState, useEffect, useCallback } from 'react';

export interface AuthUser {
    username: string;
    displayName: string;
}

export interface UseAuthReturn {
    user: AuthUser | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const TOKEN_KEY = 'iqbrain_token';

export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // On mount, validate any stored token
    useEffect(() => {
        const stored = localStorage.getItem(TOKEN_KEY);
        if (!stored) {
            setIsLoading(false);
            return;
        }

        fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${stored}` },
        })
            .then((res) => {
                if (!res.ok) throw new Error('token_invalid');
                return res.json() as Promise<{ user: AuthUser }>;
            })
            .then(({ user: u }) => {
                setUser(u);
                setToken(stored);
            })
            .catch(() => {
                localStorage.removeItem(TOKEN_KEY);
                setToken(null);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        setError(null);
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({ error: 'Login failed' })) as { error?: string };
                throw new Error(body.error ?? 'Invalid username or password');
            }

            const { token: newToken, user: newUser } = await res.json() as { token: string; user: AuthUser };
            localStorage.setItem(TOKEN_KEY, newToken);
            setToken(newToken);
            setUser(newUser);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
    }, []);

    return { user, token, isLoading, error, login, logout };
}
