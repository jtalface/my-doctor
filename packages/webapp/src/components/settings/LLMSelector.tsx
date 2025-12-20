import { useState, useEffect } from 'react';
import { api, LLMStatus } from '../../services/api';
import styles from './LLMSelector.module.css';

interface LLMSelectorProps {
  compact?: boolean;
  onChange?: (provider: string) => void;
}

export function LLMSelector({ compact = false, onChange }: LLMSelectorProps) {
  const [status, setStatus] = useState<LLMStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const llmStatus = await api.getLLMStatus();
      setStatus(llmStatus);
    } catch (err) {
      setError('Failed to load LLM status');
      console.error('LLM status error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderChange = async (provider: string) => {
    if (!status || provider === status.activeProvider) return;

    try {
      setIsChanging(true);
      setError(null);
      const newStatus = await api.setLLMProvider(provider);
      setStatus(newStatus);
      onChange?.(provider);
    } catch (err) {
      setError('Failed to change provider');
      console.error('Provider change error:', err);
    } finally {
      setIsChanging(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.error}>{error}</div>
        <button className={styles.retryButton} onClick={loadStatus}>Retry</button>
      </div>
    );
  }

  if (!status) return null;

  const getProviderIcon = (name: string) => {
    switch (name) {
      case 'openai': return '🤖';
      case 'lm-studio': return '💻';
      default: return '🔮';
    }
  };

  const getProviderLabel = (name: string) => {
    switch (name) {
      case 'openai': return 'OpenAI (GPT)';
      case 'lm-studio': return 'LM Studio (Local)';
      default: return name;
    }
  };

  if (compact) {
    return (
      <div className={`${styles.container} ${styles.compact}`}>
        <select
          className={styles.select}
          value={status.activeProvider}
          onChange={(e) => handleProviderChange(e.target.value)}
          disabled={isChanging}
        >
          {status.providers.map((provider) => (
            <option 
              key={provider.name} 
              value={provider.name}
              disabled={!provider.isAvailable}
            >
              {getProviderIcon(provider.name)} {getProviderLabel(provider.name)}
              {!provider.isAvailable && ' (unavailable)'}
            </option>
          ))}
        </select>
        {isChanging && <span className={styles.spinner}>⏳</span>}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>AI Model</h3>
      <p className={styles.description}>
        Select which AI model to use for health guidance
      </p>

      <div className={styles.providers}>
        {status.providers.map((provider) => (
          <button
            key={provider.name}
            className={`${styles.providerCard} ${
              status.activeProvider === provider.name ? styles.active : ''
            } ${!provider.isAvailable ? styles.unavailable : ''}`}
            onClick={() => handleProviderChange(provider.name)}
            disabled={!provider.isAvailable || isChanging}
          >
            <div className={styles.providerIcon}>
              {getProviderIcon(provider.name)}
            </div>
            <div className={styles.providerInfo}>
              <span className={styles.providerName}>
                {getProviderLabel(provider.name)}
              </span>
              {provider.model && (
                <span className={styles.providerModel}>{provider.model}</span>
              )}
              {!provider.isAvailable && (
                <span className={styles.unavailableLabel}>Not configured</span>
              )}
            </div>
            {status.activeProvider === provider.name && (
              <span className={styles.activeIndicator}>✓</span>
            )}
          </button>
        ))}
      </div>

      {error && <p className={styles.errorMessage}>{error}</p>}
      
      <p className={styles.hint}>
        {status.activeProvider === 'openai' 
          ? '☁️ Using cloud AI - faster responses, requires internet'
          : '💻 Using local AI - private, runs on your machine'}
      </p>
    </div>
  );
}

