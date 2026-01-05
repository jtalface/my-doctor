import { BandBadge } from './BandBadge';
import type { ItemResult } from '../types';

interface ItemCardProps {
  item: {
    id: string;
    title: string;
    domain: string;
    difficulty: string;
  };
  result?: ItemResult;
  onSelect: (id: string) => void;
  isSelected?: boolean;
}

const difficultyColors: Record<string, string> = {
  easy: 'text-emerald-400 bg-emerald-400/10',
  medium: 'text-amber-400 bg-amber-400/10',
  high: 'text-rose-400 bg-rose-400/10',
};

const domainIcons: Record<string, string> = {
  acute_care: '🚨',
  endocrinology: '🧬',
  cardiology: '❤️',
  infectious_disease: '🦠',
  neurology: '🧠',
  public_health: '🏥',
  clinical_safety: '⚠️',
  ethics: '⚖️',
  health_systems: '🏛️',
  health_economics: '💰',
  pathophysiology: '🔬',
  preventive_care: '🛡️',
  diagnostics: '🔍',
};

export function ItemCard({ item, result, onSelect, isSelected }: ItemCardProps) {
  return (
    <button
      onClick={() => onSelect(item.id)}
      className={`
        w-full text-left p-4 rounded-xl transition-all duration-200
        ${isSelected 
          ? 'glass-strong ring-2 ring-violet-500/50 glow-violet' 
          : 'glass hover:bg-white/5'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Domain icon */}
        <div className="text-2xl flex-shrink-0">
          {domainIcons[item.domain] || '📋'}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-violet-400">{item.id}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColors[item.difficulty]}`}>
              {item.difficulty}
            </span>
          </div>
          
          {/* Title */}
          <h3 className="font-body text-sm text-white/90 line-clamp-2 mb-2">
            {item.title}
          </h3>
          
          {/* Result or status */}
          {result ? (
            <div className="flex items-center gap-3">
              <BandBadge band={result.band} size="sm" />
              <span className="font-mono text-sm text-white/60">
                {result.final_score_0_100.toFixed(1)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-white/40">Not evaluated</span>
          )}
        </div>
        
        {/* Score indicator */}
        {result && (
          <div 
            className="w-1 h-12 rounded-full flex-shrink-0"
            style={{
              background: result.final_score_0_100 >= 75 
                ? 'linear-gradient(to bottom, #10b981, #3b82f6)' 
                : result.final_score_0_100 >= 50 
                  ? 'linear-gradient(to bottom, #f59e0b, #f97316)'
                  : 'linear-gradient(to bottom, #ef4444, #dc2626)',
            }}
          />
        )}
      </div>
    </button>
  );
}

