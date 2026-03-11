import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// AppConfig schema
// ---------------------------------------------------------------------------
export interface ExamplePrompt {
    icon: string;
    label: string;
    query: string;
}

export interface AppConfig {
    // Branding
    appName: string;
    appTagline: string;
    accentColor: string; // hex, e.g. "#f59e0b"

    // Example prompts shown on empty chat
    examplePrompts: ExamplePrompt[];

    // OpenRouter (overrides OPENROUTER_API_KEY env var when non-empty)
    openrouterApiKey: string;

    // LLM allowlist — empty array means "show all models from OpenRouter"
    modelAllowlist: string[];
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------
const DEFAULTS: AppConfig = {
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
    modelAllowlist: [],
};

// ---------------------------------------------------------------------------
// File path — DATA_DIR env var defaults to <server cwd>/data
// ---------------------------------------------------------------------------
const DATA_DIR = process.env.DATA_DIR ?? path.resolve(process.cwd(), 'data');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');

// In-memory cache
let _config: AppConfig | null = null;

function ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

export function getConfig(): AppConfig {
    if (_config) return _config;

    ensureDataDir();

    if (fs.existsSync(CONFIG_PATH)) {
        try {
            const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
            _config = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppConfig>) };
            return _config;
        } catch {
            console.warn('[config] Failed to parse config.json — using defaults');
        }
    }

    _config = { ...DEFAULTS };
    return _config;
}

export function setConfig(partial: Partial<AppConfig>): AppConfig {
    const current = getConfig();
    _config = { ...current, ...partial };

    ensureDataDir();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(_config, null, 2), 'utf-8');
    console.log('[config] Config saved to', CONFIG_PATH);

    return _config;
}

/** Returns the effective OpenRouter API key (config takes precedence over env) */
export function getOpenRouterKey(): string {
    const cfg = getConfig();
    return cfg.openrouterApiKey || process.env.OPENROUTER_API_KEY || '';
}
