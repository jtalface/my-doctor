import { useState, useEffect } from 'react';
import { BandBadge } from './BandBadge';
import { ScoreRing } from './ScoreRing';
import { DimensionBar } from './DimensionBar';
import type { ItemResult, EvalItem } from '../types';

interface ResultDetailProps {
  result: ItemResult;
  item?: EvalItem | null;
  onClose: () => void;
}

const dimensionColors: Record<string, string> = {
  clinical_accuracy: '#8b5cf6',
  reasoning_quality: '#3b82f6',
  safety_and_escalation: '#ef4444',
  uncertainty_handling: '#f59e0b',
  africa_context_fit: '#10b981',
};

const dimensionMax: Record<string, number> = {
  clinical_accuracy: 35,
  reasoning_quality: 15,
  safety_and_escalation: 25,
  uncertainty_handling: 10,
  africa_context_fit: 15,
};

export function ResultDetail({ result, item, onClose }: ResultDetailProps) {
  const [showResponse, setShowResponse] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="glass-strong rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-sm text-violet-400">{result.item_id}</span>
                <BandBadge band={result.band} />
                {result.unsafe_flag && (
                  <span className="px-2 py-0.5 text-xs bg-rose-500/30 text-rose-400 rounded-full animate-pulse">
                    ⚠️ UNSAFE
                  </span>
                )}
              </div>
              <h2 className="font-display text-xl text-white font-semibold">
                {item?.title || 'Evaluation Result'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Score overview */}
            <div className="flex flex-col items-center">
              <ScoreRing score={result.final_score_0_100} size={160} strokeWidth={12} />
              <p className="mt-4 text-white/60 text-sm text-center">
                Overall Score
              </p>
            </div>

            {/* Dimension breakdown */}
            <div className="space-y-4">
              <h3 className="font-body text-sm text-white/40 uppercase tracking-wider mb-4">
                Dimension Scores
              </h3>
              {Object.entries(result.dimension_scores).map(([key, value]) => (
                <DimensionBar
                  key={key}
                  name={key}
                  score={value}
                  maxScore={dimensionMax[key] || 25}
                  color={dimensionColors[key] || '#8b5cf6'}
                />
              ))}
            </div>
          </div>

          {/* Question */}
          {item && (
            <div className="mt-8">
              <h3 className="font-body text-sm text-white/40 uppercase tracking-wider mb-3">
                Question
              </h3>
              <p className="text-white/80 bg-white/5 rounded-xl p-4 font-body">
                {item.question}
              </p>
            </div>
          )}

          {/* Gold Answer */}
          {item && (
            <div className="mt-6">
              <h3 className="font-body text-sm text-white/40 uppercase tracking-wider mb-3">
                Expected Answer
              </h3>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-emerald-300/90 font-body text-sm">
                  {item.gold_answer.short}
                </p>
              </div>
            </div>
          )}

          {/* Model Response */}
          {result.response && (
            <div className="mt-6">
              <button
                onClick={() => setShowResponse(!showResponse)}
                className="flex items-center gap-2 font-body text-sm text-white/40 uppercase tracking-wider mb-3 hover:text-white/60 transition-colors"
              >
                <svg 
                  className={`w-4 h-4 transition-transform ${showResponse ? 'rotate-90' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Model Response
              </button>
              {showResponse && (
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                  <p className="text-violet-300/90 font-body text-sm whitespace-pre-wrap">
                    {result.response}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Missed Key Points */}
          {result.missed_key_points.length > 0 && (
            <div className="mt-6">
              <h3 className="font-body text-sm text-white/40 uppercase tracking-wider mb-3">
                Missed Key Points
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.missed_key_points.map((point, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm rounded-lg"
                  >
                    {point}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {result.notes.length > 0 && (
            <div className="mt-6">
              <h3 className="font-body text-sm text-white/40 uppercase tracking-wider mb-3">
                Scoring Notes
              </h3>
              <div className="space-y-2">
                {result.notes.map((note, idx) => (
                  <p key={idx} className="text-white/50 font-mono text-xs">
                    {note}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

