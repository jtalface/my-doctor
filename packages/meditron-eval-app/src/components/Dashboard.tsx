import { ScoreRing } from './ScoreRing';
import { BandBadge } from './BandBadge';
import type { EvalSummary, EvalProgress } from '../types';

interface DashboardProps {
  summary: EvalSummary | null;
  progress: EvalProgress | null;
}

export function Dashboard({ summary, progress }: DashboardProps) {
  const isRunning = progress?.status === 'running';
  const hasResults = summary && summary.results && summary.results.length > 0;

  // Calculate domain breakdown
  const domainScores: Record<string, { total: number; count: number }> = {};
  if (summary?.results) {
    for (const result of summary.results) {
      const domain = result.item_id.split('-')[0]; // Simple extraction
      if (!domainScores[domain]) {
        domainScores[domain] = { total: 0, count: 0 };
      }
      domainScores[domain].total += result.final_score_0_100;
      domainScores[domain].count += 1;
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main score card */}
      <div className="glass-strong rounded-2xl p-6 glow-violet">
        <h2 className="font-display text-lg text-white/60 mb-6">Overall Score</h2>
        <div className="flex flex-col items-center">
          {isRunning ? (
            <div className="relative">
              <ScoreRing 
                score={summary?.avg_score || 0} 
                size={180} 
                strokeWidth={14}
                label="Running..."
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              </div>
            </div>
          ) : hasResults ? (
            <ScoreRing 
              score={summary.avg_score} 
              size={180} 
              strokeWidth={14}
              label="avg"
            />
          ) : (
            <div className="w-[180px] h-[180px] rounded-full border-[14px] border-white/10 flex items-center justify-center">
              <span className="text-white/30 font-body">No data</span>
            </div>
          )}
          
          {hasResults && (
            <p className="mt-4 text-white/50 text-sm">
              {summary.results.length} items evaluated
            </p>
          )}
        </div>
      </div>

      {/* Progress card */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-lg text-white/60 mb-6">Evaluation Progress</h2>
        
        {isRunning && progress ? (
          <div className="space-y-6">
            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Progress</span>
                <span className="font-mono text-violet-400">
                  {progress.completed}/{progress.total}
                </span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full progress-bar rounded-full transition-all duration-300"
                  style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                />
              </div>
            </div>

            {/* Current item */}
            {progress.current_item_id && (
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Currently evaluating</p>
                <p className="font-mono text-violet-400">{progress.current_item_id}</p>
              </div>
            )}

            {/* ETA estimate */}
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
              <span>Evaluation in progress...</span>
            </div>
          </div>
        ) : progress?.status === 'completed' ? (
          <div className="flex flex-col items-center justify-center h-32">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-400 font-body">Evaluation Complete</p>
            {summary?.timestamp && (
              <p className="text-xs text-white/30 mt-1">
                {new Date(summary.timestamp).toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-white/30">
            <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-body">Ready to evaluate</p>
          </div>
        )}
      </div>

      {/* Band distribution */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-lg text-white/60 mb-6">Band Distribution</h2>
        
        {hasResults ? (
          <div className="space-y-3">
            {Object.entries(summary.band_counts).map(([band, count]) => {
              const percentage = (count / summary.results.length) * 100;
              return (
                <div key={band} className="flex items-center gap-3">
                  <BandBadge band={band} size="sm" />
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: band === 'Excellent' ? '#10b981' 
                          : band === 'Good' ? '#3b82f6'
                          : band === 'Fair' ? '#f59e0b'
                          : band === 'Poor' ? '#f97316'
                          : '#ef4444'
                      }}
                    />
                  </div>
                  <span className="font-mono text-sm text-white/50 w-8 text-right">
                    {count}
                  </span>
                </div>
              );
            })}

            {/* Unsafe count */}
            {summary.unsafe_count > 0 && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-rose-400">⚠️</span>
                  <span className="text-rose-300 text-sm font-body">
                    {summary.unsafe_count} unsafe response{summary.unsafe_count > 1 ? 's' : ''} detected
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-white/30">
            <p className="font-body">No results yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

