import { clsx } from 'clsx';
import styles from './PromptPanel.module.css';

export interface PromptPanelProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'warning';
  isLoading?: boolean;
  className?: string;
}

export function PromptPanel({
  title,
  subtitle,
  icon,
  variant = 'default',
  isLoading = false,
  className,
}: PromptPanelProps) {
  if (isLoading) {
    return (
      <div className={clsx(styles.promptPanel, styles[variant], className)}>
        <div className={styles.skeleton}>
          <div className={styles.skeletonLine} style={{ width: '90%' }} />
          <div className={styles.skeletonLine} style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  return (
    <section 
      className={clsx(styles.promptPanel, styles[variant], className)}
      role="region"
      aria-labelledby="prompt-title"
    >
      {icon && <div className={styles.icon} aria-hidden="true">{icon}</div>}
      <h2 id="prompt-title" className={styles.title}>{title}</h2>
      {subtitle && (
        <p className={styles.subtitle}>{subtitle}</p>
      )}
    </section>
  );
}

