import { useEffect, useState } from 'react';

interface HeaderProps {
  health: {
    status: string;
    llm_connected: boolean;
    llm_error?: string;
    dataset_loaded: boolean;
    items_count: number;
    model: string;
  } | null;
  onRefresh: () => void;
}

export function Header({ health, onRefresh }: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="glass-strong rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          {/* Logo */}
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg glow-violet">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3" strokeWidth="1.5"/>
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#1a1333] pulse-dot"></div>
          </div>

          {/* Title */}
          <div>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight">
              Meditron <span className="text-gradient">Eval Suite</span>
            </h1>
            <p className="text-sm text-white/50 font-body">
              Africa Health AI Evaluation Framework
            </p>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-6">
          {/* Time */}
          <div className="text-right">
            <div className="font-mono text-lg text-white/80 tabular-nums">
              {time.toLocaleTimeString()}
            </div>
            <div className="text-xs text-white/40">
              {time.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Divider */}
          <div className="h-10 w-px bg-white/10"></div>

          {/* Connection status */}
          <div className="flex items-center gap-4">
            {/* LLM Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${health?.llm_connected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]'}`}></div>
              <div className="text-sm">
                <span className="text-white/60">LLM:</span>{' '}
                <span className={health?.llm_connected ? 'text-emerald-400' : 'text-rose-400'}>
                  {health?.llm_connected ? health.model : 'Disconnected'}
                </span>
              </div>
            </div>

            {/* Dataset Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${health?.dataset_loaded ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'}`}></div>
              <div className="text-sm">
                <span className="text-white/60">Dataset:</span>{' '}
                <span className={health?.dataset_loaded ? 'text-emerald-400' : 'text-amber-400'}>
                  {health?.dataset_loaded ? `${health.items_count} items` : 'Not loaded'}
                </span>
              </div>
            </div>

            {/* Refresh button */}
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

