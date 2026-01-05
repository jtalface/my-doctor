interface EvalControlsProps {
  isRunning: boolean;
  hasResults: boolean;
  isConnected: boolean;
  selectedCount: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export function EvalControls({
  isRunning,
  hasResults,
  isConnected,
  selectedCount,
  onStart,
  onStop,
  onReset,
  onSelectAll,
  onClearSelection,
}: EvalControlsProps) {
  return (
    <div className="glass rounded-2xl p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Main action button */}
        {isRunning ? (
          <button
            onClick={onStop}
            className="flex items-center gap-2 px-6 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-xl font-body font-medium transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            Stop Evaluation
          </button>
        ) : (
          <button
            onClick={onStart}
            disabled={!isConnected}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-body font-medium transition-all
              ${isConnected
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
              }
            `}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {selectedCount > 0 
              ? `Run ${selectedCount} Selected` 
              : 'Run All Tests'
            }
          </button>
        )}

        {/* Reset button */}
        {hasResults && !isRunning && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl font-body transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        )}

        {/* Divider */}
        <div className="h-8 w-px bg-white/10 hidden sm:block" />

        {/* Selection controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAll}
            disabled={isRunning}
            className="px-3 py-2 text-sm bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Select All
          </button>
          <button
            onClick={onClearSelection}
            disabled={isRunning || selectedCount === 0}
            className="px-3 py-2 text-sm bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>

        {/* Selection indicator */}
        {selectedCount > 0 && (
          <span className="text-sm text-violet-400 font-mono">
            {selectedCount} selected
          </span>
        )}

        {/* Connection warning */}
        {!isConnected && (
          <div className="ml-auto flex items-center gap-2 text-amber-400 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>LLM not connected</span>
          </div>
        )}
      </div>
    </div>
  );
}

