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

export function Logo({ size = 'md', variant = 'mark', className = '' }: LogoProps) {
  const pixelSize = sizeMap[size];
  
  // Icon-only images (no text)
  const getIconSrc = () => {
    if (pixelSize <= 64) return '/icons/zambe-icon-96x96.png';
    if (pixelSize <= 96) return '/icons/zambe-icon-256x256.png';
    return '/icons/zambe-icon-512x512.png';
  };

  // Mark images (icon + ZAMBE text below)
  const getMarkSrc = () => {
    if (pixelSize <= 64) return '/icons/zambe-mark-128x128.png';
    if (pixelSize <= 128) return '/icons/zambe-mark-256x256.png';
    return '/icons/zambe-mark-512x512.png';
  };

  // Full/primary images (horizontal logo with text)
  const getFullSrc = () => {
    if (pixelSize <= 96) return '/icons/zambe-primary-400x200.png';
    return '/icons/zambe-primary-800x400.png';
  };

  if (variant === 'full') {
    return (
      <img 
        src={getFullSrc()} 
        alt="Zambe" 
        className={`${styles.logo} ${styles[size]} ${className}`}
        style={{ height: pixelSize, width: 'auto' }}
      />
    );
  }

  const imageSrc = variant === 'icon' ? getIconSrc() : getMarkSrc();

  return (
    <img 
      src={imageSrc} 
      alt="Zambe" 
      className={`${styles.logo} ${styles[size]} ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    />
  );
}
