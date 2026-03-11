import { useState, useEffect } from 'react';
import {
    CiCircleRemove, CiCircleCheck, CiWarning,
    CiPalette, CiChat1, CiLock, CiServer,
    CiTrash, CiCirclePlus,
} from 'react-icons/ci';
import type { ClientAppConfig, ExamplePrompt } from '../context/ConfigContext';

interface Props {
    config: ClientAppConfig;
    onSave: (partial: Partial<ClientAppConfig>) => Promise<void>;
    onClose: () => void;
}

// ── Shared helpers ─────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">{children}</h3>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="mb-4">
            <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>
            {children}
        </div>
    );
}

function Input({ value, onChange, type = 'text', placeholder }: {
    value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all placeholder-zinc-600"
        />
    );
}

function SaveBtn({ loading, onClick }: { loading: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 text-zinc-950 disabled:text-zinc-500 transition-colors flex items-center gap-1.5"
        >
            {loading ? (
                <>
                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving…
                </>
            ) : 'Save'}
        </button>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────

const TABS = [
    { id: 'branding', Icon: CiPalette, label: 'Branding' },
    { id: 'prompts', Icon: CiChat1, label: 'Prompts' },
    { id: 'apikey', Icon: CiLock, label: 'API Key' },
    { id: 'models', Icon: CiServer, label: 'LLM List' },
] as const;

type TabId = typeof TABS[number]['id'];

export function AdminPanel({ config, onSave, onClose }: Props) {
    const [activeTab, setActiveTab] = useState<TabId>('branding');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [appName, setAppName] = useState(config.appName);
    const [appTagline, setAppTagline] = useState(config.appTagline);
    const [accentColor, setAccentColor] = useState(config.accentColor);
    const [prompts, setPrompts] = useState<ExamplePrompt[]>(config.examplePrompts);
    const [apiKey, setApiKey] = useState('');
    const [keyIsSet, setKeyIsSet] = useState(config._keyIsSet);
    const [allowlist, setAllowlist] = useState(config.modelAllowlist.join('\n'));

    useEffect(() => {
        setAppName(config.appName);
        setAppTagline(config.appTagline);
        setAccentColor(config.accentColor);
        setPrompts(config.examplePrompts);
        setKeyIsSet(config._keyIsSet);
        setAllowlist(config.modelAllowlist.join('\n'));
    }, [config]);

    function showToast(message: string, type: 'success' | 'error') {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }

    async function save(data: Partial<ClientAppConfig>) {
        setSaving(true);
        try {
            await onSave(data);
            showToast('Saved successfully', 'success');
        } catch {
            showToast('Failed to save', 'error');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div className="flex-1 bg-black/50" onClick={onClose} />

            {/* Panel */}
            <div className="w-full max-w-md bg-zinc-950 border-l border-zinc-800 flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
                    <div>
                        <h2 className="text-zinc-100 font-semibold text-sm">Admin Settings</h2>
                        <p className="text-zinc-500 text-xs mt-0.5">Configure your IQBrain instance</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-800"
                    >
                        <CiCircleRemove className="text-xl" />
                    </button>
                </div>

                {/* Tab bar */}
                <div className="flex border-b border-zinc-800 flex-shrink-0">
                    {TABS.map(({ id, Icon, label }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex-1 flex flex-col items-center gap-0.5 px-2 py-2.5 text-xs font-medium transition-colors ${activeTab === id
                                    ? 'text-amber-400 border-b-2 border-amber-400'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            <Icon className="text-base" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 py-5">

                    {/* ── BRANDING ── */}
                    {activeTab === 'branding' && (
                        <div>
                            <SectionTitle>Branding</SectionTitle>
                            <Field label="App Name">
                                <Input value={appName} onChange={setAppName} placeholder="IQBrain" />
                            </Field>
                            <Field label="Tagline">
                                <Input value={appTagline} onChange={setAppTagline} placeholder="Manufacturing AI" />
                            </Field>
                            <Field label="Accent Color">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={accentColor}
                                        onChange={(e) => setAccentColor(e.target.value)}
                                        className="w-10 h-10 rounded-lg border border-zinc-700 bg-zinc-800 cursor-pointer p-0.5"
                                    />
                                    <Input value={accentColor} onChange={setAccentColor} placeholder="#f59e0b" />
                                </div>
                                <p className="text-zinc-600 text-xs mt-1.5">Updates header, buttons, and UI accents</p>
                            </Field>
                            <SaveBtn loading={saving} onClick={() => void save({ appName, appTagline, accentColor })} />
                        </div>
                    )}

                    {/* ── PROMPTS ── */}
                    {activeTab === 'prompts' && (
                        <div>
                            <SectionTitle>Example Prompts</SectionTitle>
                            <p className="text-zinc-500 text-xs mb-4">Cards shown on the empty chat screen to guide users.</p>
                            <div className="space-y-3">
                                {prompts.map((p, i) => (
                                    <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={p.icon}
                                                onChange={(e) => { const n = [...prompts]; n[i] = { ...n[i], icon: e.target.value }; setPrompts(n); }}
                                                className="w-12 bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-2 py-1.5 text-center focus:outline-none focus:border-amber-500/60"
                                                placeholder="⚡"
                                            />
                                            <input
                                                type="text"
                                                value={p.label}
                                                onChange={(e) => { const n = [...prompts]; n[i] = { ...n[i], label: e.target.value }; setPrompts(n); }}
                                                className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500/60"
                                                placeholder="Label"
                                            />
                                            <button
                                                onClick={() => setPrompts(prompts.filter((_, j) => j !== i))}
                                                className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                                                title="Remove"
                                            >
                                                <CiTrash className="text-lg" />
                                            </button>
                                        </div>
                                        <textarea
                                            value={p.query}
                                            onChange={(e) => { const n = [...prompts]; n[i] = { ...n[i], query: e.target.value }; setPrompts(n); }}
                                            rows={2}
                                            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500/60 resize-none"
                                            placeholder="Query text…"
                                        />
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setPrompts([...prompts, { icon: '✨', label: 'New Prompt', query: '' }])}
                                className="mt-3 w-full text-xs text-zinc-500 hover:text-zinc-300 border border-dashed border-zinc-700 hover:border-zinc-600 rounded-xl py-2 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <CiCirclePlus className="text-base" /> Add prompt
                            </button>
                            <div className="mt-4">
                                <SaveBtn loading={saving} onClick={() => void save({ examplePrompts: prompts })} />
                            </div>
                        </div>
                    )}

                    {/* ── API KEY ── */}
                    {activeTab === 'apikey' && (
                        <div>
                            <SectionTitle>OpenRouter API Key</SectionTitle>
                            <p className="text-zinc-500 text-xs mb-4">
                                Overrides the <code className="text-zinc-400 bg-zinc-800 px-1 rounded">OPENROUTER_API_KEY</code> env var.
                                Takes effect immediately — no Docker restart needed.
                            </p>
                            {keyIsSet && (
                                <div className="mb-4 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                                    <CiCircleCheck className="text-base flex-shrink-0" /> API key is currently set
                                </div>
                            )}
                            <Field label="New API Key">
                                <Input
                                    value={apiKey}
                                    onChange={setApiKey}
                                    type="password"
                                    placeholder={keyIsSet ? 'Enter new key to replace…' : 'sk-or-…'}
                                />
                            </Field>
                            <SaveBtn
                                loading={saving}
                                onClick={() => void save({ openrouterApiKey: apiKey }).then(() => { setKeyIsSet(true); setApiKey(''); })}
                            />
                        </div>
                    )}

                    {/* ── LLM LIST ── */}
                    {activeTab === 'models' && (
                        <div>
                            <SectionTitle>LLM Allowlist</SectionTitle>
                            <p className="text-zinc-500 text-xs mb-4">
                                One model ID per line. Leave <strong className="text-zinc-400">empty</strong> to show all OpenRouter models.
                            </p>
                            <textarea
                                value={allowlist}
                                onChange={(e) => setAllowlist(e.target.value)}
                                rows={8}
                                placeholder={`meta-llama/llama-3.3-70b-instruct\ngoogle/gemma-3-27b-it\nmistralai/mistral-small-3.1-24b-instruct`}
                                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-mono rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500/60 resize-none"
                            />
                            <p className="text-zinc-600 text-xs mt-1.5">
                                {allowlist.trim()
                                    ? `${allowlist.trim().split('\n').filter(Boolean).length} model(s) shown`
                                    : 'All models will be shown'}
                            </p>
                            <div className="mt-3">
                                <SaveBtn
                                    loading={saving}
                                    onClick={() => void save({ modelAllowlist: allowlist.trim().split('\n').filter(Boolean) })}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Toast */}
                {toast && (
                    <div className="px-5 pb-4 flex-shrink-0">
                        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${toast.type === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}>
                            {toast.type === 'success'
                                ? <CiCircleCheck className="text-base flex-shrink-0" />
                                : <CiWarning className="text-base flex-shrink-0" />}
                            {toast.message}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
