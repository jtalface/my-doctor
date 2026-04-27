import styles from './Logo.module.css';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'mark' | 'full';
  className?: string;
}

const sizeMap = {
  sm: 42,
  md: 64,
  lg: 96,
  xl: 128,
};

/** Vite base path (e.g. `/doctor/`) so public assets resolve in dev and production. */
function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${normalized}`;
}

export function Logo({ size = 'md', variant = 'mark', className = '' }: LogoProps) {
  const pixelSize = sizeMap[size];

  const getIconSrc = () => {
    if (pixelSize <= 64) return assetUrl('icons/zambe-icon-96x96.png');
    if (pixelSize <= 96) return assetUrl('icons/zambe-icon-256x256.png');
    return assetUrl('icons/zambe-icon-512x512.png');
  };

  const getMarkSrc = () => {
    if (pixelSize <= 64) return assetUrl('icons/zambe-mark-128x128.png');
    if (pixelSize <= 128) return assetUrl('icons/zambe-mark-256x256.png');
    return assetUrl('icons/zambe-mark-512x512.png');
  };

  const getFullSrc = () => {
    if (size === 'xl' || size === 'lg') return assetUrl('icons/zambe-primary-800x400.png');
    return assetUrl('icons/zambe-primary-400x200.png');
  };

  const fullHeightPx = { sm: 40, md: 56, lg: 72, xl: 88 }[size];

  if (variant === 'full') {
    return (
      <img
        src={getFullSrc()}
        alt="Zambe"
        className={`${styles.logo} ${className}`.trim()}
        style={{ height: fullHeightPx, width: 'auto', maxWidth: '100%' }}
      />
    );
  }

  const imageSrc = variant === 'icon' ? getIconSrc() : getMarkSrc();

  return (
    <img
      src={imageSrc}
      alt="Zambe"
      className={`${styles.logo} ${styles[size]} ${className}`.trim()}
    />
  );
}
