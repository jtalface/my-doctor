/**
 * ProviderCard Component
 * 
 * Displays a healthcare provider in a selectable card format.
 */

import { Provider } from '../../services/api';
import { useTranslate } from '../../i18n';
import styles from './ProviderCard.module.css';

interface ProviderCardProps {
  provider: Provider;
  onClick: (provider: Provider) => void;
  selected?: boolean;
}

export function ProviderCard({ provider, onClick, selected }: ProviderCardProps) {
  const t = useTranslate();

  return (
    <button
      className={`${styles.card} ${selected ? styles.selected : ''}`}
      onClick={() => onClick(provider)}
    >
      <div className={styles.avatar}>
        {provider.avatarUrl ? (
          <img src={provider.avatarUrl} alt="" />
        ) : (
          <span>{provider.name[0]}</span>
        )}
        <span className={`${styles.status} ${provider.isOnline ? styles.online : styles.offline}`} />
      </div>
      
      <div className={styles.info}>
        <h3 className={styles.name}>
          {provider.title} {provider.name}
        </h3>
        <p className={styles.specialty}>{provider.specialty}</p>
        
        {provider.languages.length > 0 && (
          <p className={styles.languages}>
            🗣️ {provider.languages.join(', ')}
          </p>
        )}
        
        <span className={`${styles.availability} ${provider.isOnline ? styles.onlineText : ''}`}>
          {provider.isOnline ? t('messages_online') : t('messages_offline')}
        </span>
      </div>
      
      {selected && (
        <span className={styles.checkmark}>✓</span>
      )}
    </button>
  );
}

