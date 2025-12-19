import { clsx } from 'clsx';
import styles from './LLMResponse.module.css';

export interface LLMResponseProps {
  content: string;
  isLoading?: boolean;
  showTypingAnimation?: boolean;
  avatar?: 'bot' | 'doctor';
  className?: string;
}

export function LLMResponse({
  content,
  isLoading = false,
  showTypingAnimation = false,
  avatar = 'bot',
  className,
}: LLMResponseProps) {
  if (!content && !isLoading) {
    return null;
  }

  return (
    <section 
      className={clsx(styles.responseContainer, className)}
      role="status"
      aria-live="polite"
    >
      <div className={styles.avatarContainer}>
        <div className={styles.avatar} aria-hidden="true">
          {avatar === 'bot' ? '🤖' : '👨‍⚕️'}
        </div>
      </div>
      
      <div className={styles.responseContent}>
        {isLoading ? (
          <div className={styles.typingIndicator}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
        ) : (
          <p className={clsx(styles.responseText, showTypingAnimation && styles.typing)}>
            {content}
          </p>
        )}
      </div>
    </section>
  );
}

