/**
 * NewConversationModal Component
 * 
 * Modal for selecting a provider to start a new conversation.
 */

import { useState, useEffect, useRef } from 'react';
import { api, Provider, Conversation } from '../../services/api';
import { useTranslate } from '../../i18n';
import { Button } from '../common';
import { ProviderCard } from './ProviderCard';
import styles from './NewConversationModal.module.css';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversation: Conversation) => void;
  dependentId?: string;
}

export function NewConversationModal({
  isOpen,
  onClose,
  onConversationCreated,
  dependentId,
}: NewConversationModalProps) {
  const t = useTranslate();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if we've already loaded providers to prevent duplicate requests
  const hasLoadedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load providers
  useEffect(() => {
    if (!isOpen) {
      hasLoadedRef.current = false;
      return;
    }

    // Prevent duplicate requests
    if (hasLoadedRef.current || providers.length > 0) return;
    hasLoadedRef.current = true;

    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const loadProviders = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const fetchedProviders = await api.getProviders();
        setProviders(fetchedProviders);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load providers');
      } finally {
        setIsLoading(false);
      }
    };

    loadProviders();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [isOpen, providers.length]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedProvider(null);
      setSubject('');
      setError(null);
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!selectedProvider) return;
    
    setIsCreating(true);
    setError(null);
    
    try {
      const conversation = await api.createConversation(
        selectedProvider._id,
        { subject: subject.trim() || undefined, dependentId }
      );
      onConversationCreated(conversation);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages_error_create_conversation'));
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{t('messages_new_conversation')}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {/* Subject input */}
          <div className={styles.field}>
            <label htmlFor="subject">{t('messages_subject_optional')}</label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder={t('messages_subject_placeholder')}
              className={styles.input}
            />
          </div>

          {/* Provider selection */}
          <div className={styles.field}>
            <label>{t('messages_select_provider')}</label>
            
            {isLoading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner} />
              </div>
            ) : error ? (
              <div className={styles.errorState}>
                <p>{error}</p>
              </div>
            ) : providers.length === 0 ? (
              <div className={styles.emptyState}>
                <p>{t('messages_no_providers')}</p>
              </div>
            ) : (
              <div className={styles.providerList}>
                {providers.map(provider => (
                  <ProviderCard
                    key={provider._id}
                    provider={provider}
                    onClick={setSelectedProvider}
                    selected={selectedProvider?._id === provider._id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <Button variant="outline" onClick={onClose}>
            {t('common_cancel')}
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!selectedProvider || isCreating}
          >
            {isCreating ? t('common_loading') : t('messages_start_conversation')}
          </Button>
        </div>
      </div>
    </div>
  );
}

