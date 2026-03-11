import { useState, type FormEvent } from 'react';
import { CiWarning, CiRead, CiUnread, CiLogin } from 'react-icons/ci';
import type { UseAuthReturn } from '../hooks/useAuth';

interface Props {
    auth: UseAuthReturn;
}

export function LoginPage({ auth }: Props) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        await auth.login(username, password);
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-600/4 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-sm mx-auto px-6">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4">
                        <span className="text-zinc-950 font-black text-lg font-mono">IQ</span>
                    </div>
                    <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">IQBrain</h1>
                    <p className="text-zinc-500 text-sm mt-1">Manufacturing AI</p>
                </div>

                {/* Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl shadow-black/40">
                    <h2 className="text-zinc-100 font-medium text-base mb-5">Sign in to continue</h2>

                    {/* Error banner */}
                    {auth.error && (
                        <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
                            <CiWarning className="flex-shrink-0 mt-0.5 text-base" />
                            {auth.error}
                        </div>
                    )}

                    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                        {/* Username */}
                        <div>
                            <label className="block text-zinc-400 text-xs font-medium mb-1.5" htmlFor="username">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                autoComplete="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={auth.isLoading}
                                placeholder="admin"
                                className="w-full bg-zinc-800/70 text-zinc-100 text-sm placeholder-zinc-600 border border-zinc-700 rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all disabled:opacity-50"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-zinc-400 text-xs font-medium mb-1.5" htmlFor="password">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={auth.isLoading}
                                    placeholder="••••••••"
                                    className="w-full bg-zinc-800/70 text-zinc-100 text-sm placeholder-zinc-600 border border-zinc-700 rounded-lg px-3.5 py-2.5 pr-10 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <CiUnread className="text-lg" /> : <CiRead className="text-lg" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={!username.trim() || !password.trim() || auth.isLoading}
                            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-zinc-950 disabled:text-zinc-500 font-semibold text-sm rounded-lg py-2.5 transition-all flex items-center justify-center gap-2 mt-1"
                        >
                            {auth.isLoading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Signing in…
                                </>
                            ) : (
                                <>
                                    <CiLogin className="text-lg" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-zinc-600 text-xs mt-5">
                    IQBrain — Manufacturing Intelligence Platform
                </p>
            </div>
        </div>
    );
}
