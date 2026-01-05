interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showPercentage?: boolean;
}

export function ScoreRing({ 
  score, 
  size = 120, 
  strokeWidth = 8,
  label,
  showPercentage = true 
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  const getColor = (score: number) => {
    if (score >= 90) return { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' };
    if (score >= 75) return { stroke: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' };
    if (score >= 60) return { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' };
    if (score >= 40) return { stroke: '#f97316', glow: 'rgba(249, 115, 22, 0.4)' };
    return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' };
  };
  
  const colors = getColor(score);

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-ring transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${colors.glow})`,
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <span 
            className="font-display font-bold text-white"
            style={{ fontSize: size * 0.25 }}
          >
            {Math.round(score)}
          </span>
        )}
        {label && (
          <span 
            className="text-white/50 font-body"
            style={{ fontSize: Math.max(10, size * 0.1) }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

