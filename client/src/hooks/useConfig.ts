import { useState, useEffect, useCallback } from 'react';
import type { ClientAppConfig } from '../context/ConfigContext';

const DEFAULT_CONFIG: ClientAppConfig = {
    appName: 'IQBrain',
    appTagline: 'Manufacturing AI',
    accentColor: '#f59e0b',
    examplePrompts: [
        { icon: '⚡', label: 'Change Impact', query: 'What is the impact of replacing R245 with R250?' },
        { icon: '🔍', label: 'Where-Used', query: 'Show me all assemblies that use part R245' },
        { icon: '📋', label: 'Closure Status', query: 'Show closure status for ECR-2221' },
        { icon: '⏱', label: 'Cycle Time', query: 'What is the cycle time for ECR-2221?' },
        { icon: '📊', label: 'BOM Compare', query: 'Does the MBOM match the EBOM for Motor Controller V2?' },
    ],
    openrouterApiKey: '',
    _keyIsSet: false,
    modelAllowlist: [],
};

export function useConfig(token: string | null) {
    const [config, setConfig] = useState<ClientAppConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!token) { setIsLoading(false); return; }

        fetch('/api/admin/config', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json() as Promise<ClientAppConfig>;
            })
            .then((cfg) => setConfig(cfg))
            .catch(() => setConfig(DEFAULT_CONFIG))
            .finally(() => setIsLoading(false));
    }, [token]);

    const saveConfig = useCallback(async (partial: Partial<ClientAppConfig>) => {
        if (!token) return;
        const res = await fetch('/api/admin/config', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(partial),
        });
        if (!res.ok) throw new Error(`Failed to save: HTTP ${res.status}`);
        const updated = await res.json() as ClientAppConfig;
        setConfig(updated);
    }, [token]);

    return { config: config ?? DEFAULT_CONFIG, isLoading, saveConfig };
}
