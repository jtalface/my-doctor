/**
 * ShareDependentModal
 * 
 * Modal for sharing a dependent with another user (adding another manager).
 */

import { useState } from 'react';
import { Button, Card, CardContent } from '../common';
import { useTranslate } from '../../i18n';
import { api, type RelationshipType } from '../../services/api';
import styles from './ShareDependentModal.module.css';

interface ShareDependentModalProps {
  dependentId: string;
  dependentName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ShareDependentModal({ 
  dependentId, 
  dependentName,
  onClose, 
  onSuccess 
}: ShareDependentModalProps) {
  const t = useTranslate();
  
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const relationshipOptions: { value: RelationshipType; labelKey: string }[] = [
    { value: 'parent', labelKey: 'share_dependent_relationship_parent' },
    { value: 'guardian', labelKey: 'share_dependent_relationship_guardian' },
    { value: 'grandparent', labelKey: 'share_dependent_relationship_grandparent' },
    { value: 'sibling', labelKey: 'share_dependent_relationship_sibling' },
    { value: 'other', labelKey: 'share_dependent_relationship_other' },
  ];

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!email.trim()) {
      setError(t('share_dependent_error_email_required'));
      return;
    }
    
    if (!validateEmail(email)) {
      setError(t('share_dependent_error_email_invalid'));
      return;
    }
    
    if (!relationship) {
      setError(t('share_dependent_error_relationship_required'));
      return;
    }

    setIsLoading(true);

    try {
      // First, we need to find the user by email
      // Note: This requires a backend endpoint to look up users by email
      // For now, we'll use a direct API call that expects the managerId
      // In production, you'd want an endpoint that accepts email
      
      await api.addDependentManager(dependentId, email, relationship as RelationshipType);
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('share_dependent_error_failed');
      
      // Handle specific errors
      if (message.includes('not found')) {
        setError(t('share_dependent_error_user_not_found'));
      } else if (message.includes('already managing')) {
        setError(t('share_dependent_error_already_shared'));
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <Card variant="default" padding="lg">
            <CardContent>
              <div className={styles.successState}>
                <span className={styles.successIcon}>✓</span>
                <h2>{t('share_dependent_success_title')}</h2>
                <p>{t('share_dependent_success_message', { name: dependentName })}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <Card variant="default" padding="lg">
          <CardContent>
            <div className={styles.header}>
              <h2 className={styles.title}>{t('share_dependent_title')}</h2>
              <button 
                className={styles.closeButton} 
                onClick={onClose}
                aria-label={t('common_close')}
              >
                ×
              </button>
            </div>
            
            <p className={styles.subtitle}>
              {t('share_dependent_subtitle', { name: dependentName })}
            </p>
            
            {error && (
              <div className={styles.error}>{error}</div>
            )}
            
            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Email */}
              <div className={styles.field}>
                <label htmlFor="share-email" className={styles.label}>
                  {t('share_dependent_email_label')}
                </label>
                <input
                  id="share-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('share_dependent_email_placeholder')}
                  className={styles.input}
                  autoFocus
                />
                <span className={styles.hint}>
                  {t('share_dependent_email_hint')}
                </span>
              </div>
              
              {/* Relationship */}
              <div className={styles.field}>
                <label className={styles.label}>
                  {t('share_dependent_relationship_label')}
                </label>
                <div className={styles.radioGroup}>
                  {relationshipOptions.map(option => (
                    <label key={option.value} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="share-relationship"
                        value={option.value}
                        checked={relationship === option.value}
                        onChange={() => setRelationship(option.value)}
                        className={styles.radio}
                      />
                      <span>{t(option.labelKey as any)}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Actions */}
              <div className={styles.actions}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  {t('common_cancel')}
                </Button>
                <Button
                  type="submit"
                  isLoading={isLoading}
                >
                  {t('share_dependent_submit')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

