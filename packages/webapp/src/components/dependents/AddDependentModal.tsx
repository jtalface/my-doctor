/**
 * AddDependentModal
 * 
 * Modal for adding a new family member/dependent.
 */

import { useState } from 'react';
import { Button, Card, CardContent } from '../common';
import { LanguageSelector } from '../settings';
import { useActiveProfile } from '../../contexts';
import { useTranslate } from '../../i18n';
import { type RelationshipType } from '../../services/api';
import { DEFAULT_LANGUAGE, type LanguageCode } from '../../config/languages';
import styles from './AddDependentModal.module.css';

interface AddDependentModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddDependentModal({ onClose, onSuccess }: AddDependentModalProps) {
  const { addDependent } = useActiveProfile();
  const t = useTranslate();
  
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType | ''>('');
  const [language, setLanguage] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate max date (must be under 18)
  const today = new Date();
  const maxDate = today.toISOString().split('T')[0];
  
  // Calculate age from date of birth
  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validateForm = (): boolean => {
    setError('');
    
    if (!name.trim()) {
      setError(t('add_dependent_error_name_required'));
      return false;
    }
    
    if (!dateOfBirth) {
      setError(t('add_dependent_error_dob_required'));
      return false;
    }
    
    const age = calculateAge(dateOfBirth);
    if (age >= 18) {
      setError(t('add_dependent_error_age_requirement'));
      return false;
    }
    
    if (!relationship) {
      setError(t('add_dependent_error_relationship_required'));
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await addDependent({
        name: name.trim(),
        dateOfBirth,
        relationship: relationship as RelationshipType,
        language,
      });
      
      // Success
      onSuccess?.();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('dependents_error_create');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const relationshipOptions: { value: RelationshipType; labelKey: string }[] = [
    { value: 'parent', labelKey: 'add_dependent_relationship_parent' },
    { value: 'guardian', labelKey: 'add_dependent_relationship_guardian' },
    { value: 'grandparent', labelKey: 'add_dependent_relationship_grandparent' },
    { value: 'sibling', labelKey: 'add_dependent_relationship_sibling' },
    { value: 'other', labelKey: 'add_dependent_relationship_other' },
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <Card variant="default" padding="lg">
          <CardContent>
            <div className={styles.header}>
              <h2 className={styles.title}>{t('add_dependent_title')}</h2>
              <button 
                className={styles.closeButton} 
                onClick={onClose}
                aria-label={t('common_close')}
              >
                ×
              </button>
            </div>
            
            <p className={styles.subtitle}>{t('add_dependent_subtitle')}</p>
            
            {error && (
              <div className={styles.error}>{error}</div>
            )}
            
            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Name */}
              <div className={styles.field}>
                <label htmlFor="dep-name" className={styles.label}>
                  {t('add_dependent_name_label')}
                </label>
                <input
                  id="dep-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('add_dependent_name_placeholder')}
                  className={styles.input}
                  autoFocus
                />
              </div>
              
              {/* Date of Birth */}
              <div className={styles.field}>
                <label htmlFor="dep-dob" className={styles.label}>
                  {t('add_dependent_dob_label')}
                </label>
                <input
                  id="dep-dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  max={maxDate}
                  className={styles.input}
                />
                {dateOfBirth && (
                  <span className={styles.ageHint}>
                    {t('dependents_age_years', { age: calculateAge(dateOfBirth) })}
                  </span>
                )}
              </div>
              
              {/* Relationship */}
              <div className={styles.field}>
                <label htmlFor="dep-relationship" className={styles.label}>
                  {t('add_dependent_relationship_label')}
                </label>
                <select
                  id="dep-relationship"
                  value={relationship}
                  onChange={e => setRelationship(e.target.value as RelationshipType)}
                  className={styles.select}
                >
                  <option value="">{t('add_dependent_relationship_placeholder')}</option>
                  {relationshipOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey as any)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Language */}
              <div className={styles.field}>
                <label className={styles.label}>
                  {t('add_dependent_language_label')}
                </label>
                <LanguageSelector 
                  value={language} 
                  onChange={setLanguage}
                  variant="compact"
                />
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
                  {t('add_dependent_submit')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

