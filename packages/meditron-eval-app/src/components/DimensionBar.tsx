interface DimensionBarProps {
  name: string;
  score: number;
  maxScore: number;
  color: string;
}

export function DimensionBar({ name, score, maxScore, color }: DimensionBarProps) {
  const percentage = (score / maxScore) * 100;
  
  const formatName = (name: string) => {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="group">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-body text-white/70 group-hover:text-white transition-colors">
          {formatName(name)}
        </span>
        <span className="font-mono text-sm text-white/50">
          {score.toFixed(1)}/{maxScore}
        </span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 12px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}

