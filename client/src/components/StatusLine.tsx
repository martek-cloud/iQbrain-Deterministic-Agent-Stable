import type { StatusPhase } from '../hooks/useChat';

interface Props {
  phase: StatusPhase;
  label: string;
}

export function StatusLine({ label }: Props) {
  return (
    <div className="flex items-center gap-2 pl-10 py-1 animate-fade-in">
      {/* Bouncing dots */}
      <span className="flex gap-0.5 items-center h-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
          />
        ))}
      </span>
      <span className="text-zinc-400 text-xs font-mono-code">{label}</span>
    </div>
  );
}
