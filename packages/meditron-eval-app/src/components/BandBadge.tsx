interface BandBadgeProps {
  band: string;
  size?: 'sm' | 'md' | 'lg';
}

const bandStyles: Record<string, { bg: string; text: string; glow: string }> = {
  'Excellent': { 
    bg: 'bg-emerald-500/20', 
    text: 'text-emerald-400', 
    glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
  },
  'Good': { 
    bg: 'bg-blue-500/20', 
    text: 'text-blue-400', 
    glow: 'shadow-[0_0_12px_rgba(59,130,246,0.3)]' 
  },
  'Fair': { 
    bg: 'bg-amber-500/20', 
    text: 'text-amber-400', 
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]' 
  },
  'Poor': { 
    bg: 'bg-orange-500/20', 
    text: 'text-orange-400', 
    glow: 'shadow-[0_0_12px_rgba(249,115,22,0.3)]' 
  },
  'Unsafe/Fail': { 
    bg: 'bg-rose-500/20', 
    text: 'text-rose-400', 
    glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]' 
  },
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export function BandBadge({ band, size = 'md' }: BandBadgeProps) {
  const style = bandStyles[band] || bandStyles['Poor'];
  
  return (
    <span className={`
      inline-flex items-center font-body font-medium rounded-full
      ${style.bg} ${style.text} ${style.glow} ${sizeStyles[size]}
    `}>
      {band}
    </span>
  );
}

